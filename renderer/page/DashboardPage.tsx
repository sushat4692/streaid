import React from "react";
import { Link } from "react-router-dom";

const DashboardPage: React.FC = () => {
    return (
        <section className="my-4">
            <h2>Dashboard</h2>

            <div className="d-grid gap-3">
                <div className="card">
                    <div className="card-body">
                        <h5 className="card-title">Chatters</h5>
                        <p className="card-text">
                            Display user list that comment to target channel
                        </p>
                        <Link
                            to="/chatters"
                            className="btn btn-primary stretched-link"
                        >
                            Check
                        </Link>
                    </div>
                </div>

                <div className="card">
                    <div className="card-body">
                        <h5 className="card-title">Raiders</h5>
                        <p className="card-text">
                            Display user list that raided to target channel
                        </p>
                        <Link
                            to="/raiders"
                            className="btn btn-primary stretched-link"
                        >
                            Check
                        </Link>
                    </div>
                </div>

                <div className="card">
                    <div className="card-body">
                        <h5 className="card-title">Hosts</h5>
                        <p className="card-text">
                            Display user list that hosted to target channel
                        </p>
                        <Link
                            to="/hosts"
                            className="btn btn-primary stretched-link"
                        >
                            Check
                        </Link>
                    </div>
                </div>

                <div className="card">
                    <div className="card-body">
                        <h5 className="card-title">Channel</h5>
                        <p className="card-text">
                            You can update Channel information.
                        </p>
                        <Link
                            to="/channel"
                            className="btn btn-primary stretched-link"
                        >
                            Check
                        </Link>
                    </div>
                </div>

                <div className="card">
                    <div className="card-body">
                        <h5 className="card-title">Settings</h5>
                        <p className="card-text">Setting connecting channel</p>
                        <Link
                            to="/settings"
                            className="btn btn-primary stretched-link"
                        >
                            Check
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default DashboardPage;
