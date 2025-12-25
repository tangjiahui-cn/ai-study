/**
 * 使用Graph API建计算器代理。
 *
 * （1）将代理定义为节点或边的图形，请使用Graph API。
 * （2）将代理定义为单个函数，请使用 Functional API。
 *
 * 参考：
 * https://langchain-doc.cn/v1/python/langgraph/quickstart.html
 */
import { tool } from "@langchain/core/tools";
import * as z from "zod";
import { ChatDeepSeek } from "@langchain/deepseek";
import dotEnv from "dotenv";
import { END, MessagesZodMeta, START, StateGraph } from "@langchain/langgraph";
import { registry } from "@langchain/langgraph/zod";
import { HumanMessage, SystemMessage } from "langchain";
import { isAIMessage } from "@langchain/core/messages";

dotEnv.config({ quiet: true });

function createModel() {
  // 定义一个model
  const model = new ChatDeepSeek({
    model: "deepseek-chat",
    apiKey: process.env.DEEPSEEK_API_KEY,
    temperature: 0,
  });

  // 定义tools
  const add = tool(({ a, b }) => a + b, {
    name: "add",
    description: "两个数相加",
    schema: z.object({
      a: z.number().describe("第一个数"),
      b: z.number().describe("第二个数"),
    }),
  });
  const toolsByName = { [add.name]: add };
  const tools = Object.values(toolsByName);

  return {
    tools,
    toolsByName,
    modelWithTools: model.bindTools(tools),
  };
}

// 1、定义工具、模型
const {
  // ...
  modelWithTools,
  tools,
  toolsByName,
} = createModel();

// 2、定义状态
// 用于存储消息和LLM调用次数
// （注意：LangGraph 中的状态在代理执行过程中持续存在，带有operator.add的Annotated 类型确保
// 被追加到现有列表中，而不是替换他。）
const MessagesState = z.object({
  messages: z.array(z.custom()).register(registry, MessagesZodMeta),
  llmCalls: z.number().optional(),
});

// 3、定义模型节点（模拟LLM 调用）
async function llmCall(state) {
  return {
    messages: await modelWithTools.invoke([
      new SystemMessage("你是一个有用的助手，负责对一组输入执行算术运算。"),
      ...state?.messages,
    ]),
    llmCalls: (state?.llmCalls ?? 0) + 1,
  };
}

// 4、定义工具节点
async function toolNode(state) {
  const lastMessage = state?.messages?.at?.(-1);
  if (lastMessage == null || !isAIMessage(lastMessage)) {
    return {
      messages: [],
    };
  }
  const result = [];
  for (const toolCall of lastMessage?.tool_calls ?? []) {
    const tool = toolsByName[toolCall.name];
    const observation = await tool.invoke(toolCall);
    result.push(observation);
  }
  return {
    messages: result,
  };
}

// 5、定义结束逻辑
async function shouldContinue(state) {
  const lastMessage = state?.messages?.at?.(-1);
  if (lastMessage == null || !isAIMessage(lastMessage)) {
    return END;
  }

  // 如果 LLM 执行了工具调用，则执行操作
  if (lastMessage?.tool_calls?.length) {
    return "toolNode";
  }

  // 否则，我们停止（回复用户）
  return END;
}

// 6、构建并编译代理
// 使用StateGraph类构建，并使用 compile 编译。
const agent = new StateGraph(MessagesState)
  .addNode("llmCall", llmCall)
  .addNode("toolNode", toolNode)
  .addEdge(START, "llmCall")
  .addConditionalEdges("llmCall", shouldContinue, ["toolNode", END])
  .addEdge("toolNode", "llmCall")
  .compile();

async function run() {
  console.log("开始运行：");
  const result = await agent.invoke({
    messages: [new HumanMessage("3加4等于多少")],
  });
  for (const message of result?.messages) {
    console.log(`[${message.getType()}]: ${message.text}`);
  }
}

// run();
