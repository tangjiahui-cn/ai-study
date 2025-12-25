/**
 * Prompt Template 示例
 */
// 参考教程：https://js.langchain.com.cn/docs/getting-started/guide-chat
import { ChatPromptTemplate } from "@langchain/core/prompts";

async function getPrompt() {
  const promptTemplate = ChatPromptTemplate.fromMessages([
    { role: "system", content: "将下列内容从中文翻译成{language}。" },
    { role: "user", content: "{text}" },
  ]);
  const res = await promptTemplate.invoke({
    language: "英文",
    text: "今天真实很棒的一天啊 不是吗",
  });
  return res?.toChatMessages();
}

(async () => {
  console.log("zz --> ", await getPrompt());
})();
