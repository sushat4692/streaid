import React from "react";
import { FormattedMessage } from "react-intl";

// Component
import MetaComponent from "../component/Meta";

// Const
import licenses from "../const/licenses";

const DashboardPage: React.FC = () => {
    const displayLicenses = licenses.filter((license) => {
        return !license.name.match(/^@types\//);
    });

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

            <h3>MIT License</h3>

            <p>Copyright (c) 2021 SUSH (Satoshi Ukai)</p>

            <p>
                <FormattedMessage
                    id="Page.License.MIT1"
                    defaultMessage='Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:'
                />
            </p>

            <p>
                <FormattedMessage
                    id="Page.License.MIT2"
                    defaultMessage="The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software."
                />
            </p>

            <p>
                <FormattedMessage
                    id="Page.License.MIT3"
                    defaultMessage='THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.'
                />
            </p>

            <h3 className="mt-5">
                <FormattedMessage
                    id="Page.License.ThankYou"
                    defaultMessage="Thank you for developers of dependency libraries"
                />
            </h3>

            <ul className="list-group list-group-flush">
                {displayLicenses.map((license) => {
                    return (
                        <li
                            className="list-group-item text-break"
                            key={license.name}
                        >
                            {license.name} ({license.licenseType})
                            {license.author ? ` by ${license.author}` : ""}
                            <br />
                            <small className="text-muted">{license.link}</small>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
};

export default DashboardPage;
