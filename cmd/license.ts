import { exec } from "child_process";
import path from "path";
import { writeFileSync } from "fs-extra";

const runCommand = async (command: string): Promise<string> => {
    console.log(`Run command: ${command}`);

    return new Promise((resolve, reject) => {
        exec(command, (err, out) => {
            if (err) {
                return reject(err);
            }

            resolve(out);
        });
    });
};

runCommand(`license-report --output=json`).then((jsonString) => {
    const result = "export default " + jsonString;
    const filePath = path.join(
        __dirname,
        "..",
        "renderer",
        "const",
        "licenses.ts"
    );
    writeFileSync(filePath, result);
    runCommand(`eslint --fix --ext .ts ${filePath}`).then((out) => {
        console.log(out);
    });
});
