import React from "react";
import { Link } from "react-router-dom";
import { FormattedMessage } from "react-intl";

// Component
import MetaComponent from "../component/Meta";

export const NeedSettingPage: React.FC = () => {
    return (
        <section className="my-4">
            <MetaComponent />

            <h2 className="display-4 mb-4 py-4 text-center fw-bolder">
                <i className="bi bi-twitch me-2" />
                <FormattedMessage
                    id="Common.Title"
                    defaultMessage="Twitch Support Tool"
                />
            </h2>

            <div className="text-center">
                <p className="lead">
                    <FormattedMessage
                        id="Page.NeedSetting.Lead"
                        defaultMessage="Please update application setting first."
                    />
                </p>

                <Link className="btn btn-lg btn-primary" to="/settings">
                    Settings
                </Link>
            </div>
        </section>
    );
};

export default NeedSettingPage;
