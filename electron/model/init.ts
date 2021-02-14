import Model from "./Model";

const init = async () => {
    console.log("start init");

    const knex = Model.knex();

    if (!(await knex.schema.hasTable("chatters"))) {
        console.log("Chatter prepare");

        await knex.schema.createTable("chatters", (table) => {
            table.increments("id");
            table.string("user_name").nullable();
            table.string("display_name").nullable();
            table.timestamp("created");
            table.timestamp("updated");
        });
    }
};

export default init;
