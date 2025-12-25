/**
 * 使用Functional构建计算器代理
 */
// 1、定义工具和模型
import { tool } from "@langchain/core/tools";
import * as z from "zod";
import { ChatDeepSeek } from "@langchain/deepseek";
import dotEnv from "dotenv";
import { addMessages, entrypoint, task } from "@langchain/langgraph";
import { HumanMessage, SystemMessage } from "langchain";

dotEnv.config({ quiet: true });

const model = new ChatDeepSeek({
  model: "deepseek-chat",
  apiKey: process.env.DEEPSEEK_API_KEY,
  temperature: 0,
});

const add = tool(({ a, b }) => a + b, {
  name: "add",
  description: "两个数相加",
  schema: z.object({
    a: z.number().describe("第1个数"),
    b: z.number().describe("第2个数"),
  }),
});

const toolsByName = {
  [add.name]: add,
};
const tools = Object.values(toolsByName);
const modelWithTools = model.bindTools(tools);

// 2、定义模型节点
const callLlm = task({ name: "callLlm" }, async (messages) => {
  return modelWithTools.invoke([
    new SystemMessage("你是一个有用的助手，负责对一组输入执行算术运算。"),
    ...messages,
  ]);
});

// 3、定义工具节点
const callTool = task({ name: "callTool" }, async (toolCall) => {
  const tool = toolsByName[toolCall.name];
  return tool.invoke(toolCall);
});

// 4、定义代理
const agent = entrypoint({ name: "agent" }, async (messages) => {
  let modelResponse = await callLlm(messages);
  while (true) {
    if (!modelResponse?.tool_calls?.length) {
      break;
    }

    // 执行工具
    const toolResults = await Promise.all(
      modelResponse.tool_calls.map((toolCall) => {
        return callTool(toolCall);
      }),
    );
    messages = addMessages(messages, [modelResponse, ...toolResults]);
    modelResponse = await callLlm(messages);
  }
  return messages;
});

// 5、调用
async function run() {
  const result = await agent.invoke([new HumanMessage("3+4等于多少？")]);
  for (const message of result) {
    console.log(`[${message.getType()}]：${message?.text}`);
  }
}

run();
