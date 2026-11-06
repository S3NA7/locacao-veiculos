import "dotenv/config";
import { criarApp } from "./app.js";

const porta = Number(process.env.PORT ?? 3333);

criarApp().listen(porta, () => {
  console.log(`API de locação ouvindo em http://localhost:${porta}`);
});
