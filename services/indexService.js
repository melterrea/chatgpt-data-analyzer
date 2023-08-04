const { DirectoryLoader } = require("langchain/document_loaders/fs/directory");
const {
  JSONLoader,
  JSONLinesLoader,
} = require("langchain/document_loaders/fs/json");
const { Chroma } = require("langchain/vectorstores/chroma");
const TextLoader = require("langchain/document_loaders/fs/text");
const CSVLoader = require("langchain/document_loaders/fs/csv");
const PDFLoader = require("langchain/document_loaders/fs/pdf");
const { BufferMemory } = require("langchain/memory");
const { ConversationalRetrievalQAChain } = require("langchain/chains");
const { ChatOpenAI } = require("langchain/chat_models/openai");
const { OpenAIEmbeddings } = require("langchain/embeddings/openai");

const collectionName = "all-documents";

const fasterModel = new ChatOpenAI({
  modelName: "gpt-3.5-turbo",
  openAIApiKey: process.env.OPENAI_API_KEY,
});

const loadDocs = async () => {
  const loader = new DirectoryLoader("/data", {
    ".json": (path) => new JSONLoader(path, "/data"),
    ".jsonl": (path) => new JSONLinesLoader(path, "/data"),
    ".txt": (path) => new TextLoader(path, "/data"),
    ".csv": (path) => new CSVLoader(path, "/data"),
    ".pdf": (path) => new PDFLoader(path, "/data"),
  });

  const docs = await loader.load();

  return docs;
};

const getVectorStore = async () => {
  let vectorStore = await Chroma.fromExistingCollection(
    new OpenAIEmbeddings(),
    { collectionName }
  );

  if (!vectorStore) {
    vectorStore = await Chroma.fromDocuments(new OpenAIEmbeddings(), {
      collectionName,
    });
  }

  console.log("vectorstore", vectorStore);

  return vectorStore;
};

const queryDocs = async (question) => {
  const docs = await loadDocs();
  console.log(docs);
  const vectorStore = await getVectorStore();

  vectorStore.addDocuments(docs);

  const chain = ConversationalRetrievalQAChain.fromLLM(
    fasterModel,
    vectorStore.asRetriever(),
    {
      memory: new BufferMemory({
        memoryKey: "chat_history", // Must be set to "chat_history"
      }),
    }
  );

  return await chain.call({ question });
};

module.exports = {
  queryDocs,
};
