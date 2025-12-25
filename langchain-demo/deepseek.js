/**
 * DeepSeek 基本会话示例
 */
import { ChatDeepSeek } from "@langchain/deepseek";
import dotEnv from "dotenv";
import { HumanMessage } from "langchain";
dotEnv.config();

const model = new ChatDeepSeek({
  model: "deepseek-chat",
  apiKey: process.env.DEEPSEEK_API_KEY,
});

// 简单对话
async function basicTest() {
  const res = await model.invoke([new HumanMessage("你好")]);
  console.log("zz 简单对话 ", res?.text);
}

// 并行对话
async function multipleTest() {
  const res = await model.generate([
    [new HumanMessage("你好")],
    [new HumanMessage("1+1等于多少？")],
  ]);
  console.log(
    "zz 多个对话：",
    res?.generations?.map?.((x) => {
      return x?.map?.((y) => y?.text);
    }),
  );
}
