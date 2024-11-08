import { rimraf } from "rimraf";

// Old usage:
// rimraf.sync('./dist');

// New usage:
await rimraf("./dist", { preserveRoot: true });
