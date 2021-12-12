import { exec } from "child_process";
import path from "path";
import { writeFileSync } from "fs-extra";
import checker from "license-checker";
import { cwd } from "process";

const runCommand = async (command: string): Promise<string> => {
    console.log(`Run command: ${command}`);

    return new Promise((resolve, reject) => {
        exec(command, (err, out) => {
            if (err) {
                console.error(err);
                return reject(err);
            }

            console.log(`Finished command: ${command}`);
            resolve(out);
        });
    });
};

checker.init({ start: cwd(), direct: 1, production: true }, (err, packages) => {
    if (err) {
        console.error(err);
    }

    const dependencies: {
        name: string;
        licenseType: string;
        author: string;
        link: string;
    }[] = [];
    Object.keys(packages).map((key) => {
        const p = packages[key];
        dependencies.push({
            name: key,
            licenseType: p.licenses,
            author: p.publisher,
            link: p.repository,
        });
    });

    const jsonString = JSON.stringify(dependencies);
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
