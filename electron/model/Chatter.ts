import { Model } from "objection";

class Chatter extends Model {
    static get tableName() {
        return "chatters";
    }

    static get idColumn() {
        return "id";
    }

    static get jsonSchema() {
        return {
            type: "object",
            required: ["user_name", "display_name"],

            properties: {
                id: { type: "integer" },
                user_name: { type: "string" },
                display_name: { type: "string" },
            },
        };
    }
}

export default Chatter;
