/**
 * 简单创建一个Agent示例
 */
import * as z from "zod";
import { tool } from "@langchain/core/tools";
import dotEnv from "dotenv";
import { ChatDeepSeek } from "@langchain/deepseek";
import { createAgent, HumanMessage } from "langchain";
dotEnv.config({ quiet: true });

const deepSeekModel = new ChatDeepSeek({
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

// 这是一个agent
const agent = createAgent({
  model: deepSeekModel,
  tools: [add],
  systemPrompt: "你是一个算数专家",
});

(async function run() {
  const res = await agent.invoke({
    messages: [new HumanMessage("1+1等于多少")],
  });
  const result = res?.messages || [];
  for (const message of result) {
    console.log(`[${message.getType()}]：${message?.text}`);
  }
})();
