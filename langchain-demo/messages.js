/**
 * messages示例
 */
import { HumanMessage, AIMessage, SystemMessage } from "langchain";

const messages = [
  new SystemMessage("你是一个大屏技术专家"),
  new HumanMessage("你好"),
  new AIMessage("我不好"),
  new HumanMessage("你为什么不好？"),
];

console.log("zz -> ", messages);
