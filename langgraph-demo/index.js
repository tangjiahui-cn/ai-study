import { StateGraph, START, END, MessagesAnnotation } from "@langchain/langgraph";

const mockLm = (state) => {
  return {
    messages: [
      {
        role: "ai",
        content: "hello world",
      },
    ],
  };
};

const graph = new StateGraph(MessagesAnnotation)
  .addNode("mock_llm", mockLm)
  .addEdge(START, "mock_llm")
  .addEdge("mock_llm", END)
  .compile();

async function run() {
  const res = await graph.invoke({
    messages: [{ role: "user", content: "你好" }],
  });
  console.log("zz -> ", res);
}

run();
