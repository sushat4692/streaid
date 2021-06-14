import React from "react";
import { FormattedMessage } from "react-intl";

// Component
import MetaComponent from "../component/Meta";

// Const
import licenses from "../const/licenses";

// Styles
import styles from "./License.module.css";

const LicensePage: React.FC = () => {
    const displayLicenses = licenses.filter((license) => {
        return !license.name.match(/^@types\//);
    });

    return (
        <>
            <MetaComponent id="Common.License.Name" defaultMessage="License" />

            <div className="page-header">
                <div className="container-fluid">
                    <h1 className="page-header__text">
                        <i className="bi bi-book page-header__icon" />
                        <FormattedMessage
                            id="Common.License.Name"
                            defaultMessage="License"
                        />
                    </h1>
                </div>
            </div>

            <div className="container-fluid">
                <section className="section">
                    <h2 className="section__header">MIT License</h2>

                    <p className="section__desc">
                        Copyright (c) 2021 SUSH (Satoshi Ukai)
                    </p>

                    <p className="section__desc">
                        <FormattedMessage
                            id="Page.License.MIT1"
                            defaultMessage='Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:'
                        />
                    </p>

                    <p className="section__desc">
                        <FormattedMessage
                            id="Page.License.MIT2"
                            defaultMessage="The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software."
                        />
                    </p>

                    <p className="section__desc">
                        <FormattedMessage
                            id="Page.License.MIT3"
                            defaultMessage='THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.'
                        />
                    </p>
                </section>

                <section className="section">
                    <h2 className="section__header">
                        <FormattedMessage
                            id="Page.License.ThankYou"
                            defaultMessage="Thank you for developers of dependency libraries"
                        />
                    </h2>

                    <ul className={styles.list}>
                        {displayLicenses.map((license) => {
                            return (
                                <li
                                    className={styles.list__item}
                                    key={license.name}
                                >
                                    {license.name} ({license.licenseType})
                                    {license.author
                                        ? ` by ${license.author}`
                                        : ""}
                                    <br />
                                    <small className={styles.list__small}>
                                        {license.link}
                                    </small>
                                </li>
                            );
                        })}
                        <li className={styles.list__item}>
                            English-Japanese Dictionary "ejdict-hand" (Public
                            Domain CC0) by kujirahand
                            <br />
                            <small className={styles.list__small}>
                                https://github.com/kujirahand/EJDict
                            </small>
                        </li>
                    </ul>
                </section>
            </div>
        </>
    );
};

export default LicensePage;
