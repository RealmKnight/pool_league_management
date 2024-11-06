import { glob } from "glob";

// Old usage:
// glob.sync('./src/**/*.ts')

// New usage:
const files = await glob("./src/**/*.ts", {
  ignore: ["node_modules/**"],
});
