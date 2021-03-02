import React from "react";
import { FormattedMessage } from "react-intl";

// Component
import MetaComponent from "../component/Meta";

const DashboardPage: React.FC = () => {
    return (
        <section className="my-4">
            <MetaComponent id="Common.License.Name" defaultMessage="License" />

            <h2 className="display-6 mb-3 fw-bolder">
                <i className="bi bi-book me-2"></i>
                <FormattedMessage
                    id="Common.License.Name"
                    defaultMessage="License"
                />
            </h2>
        </section>
    );
};

export default DashboardPage;
