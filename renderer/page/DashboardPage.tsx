import React from "react";
import { Link } from "react-router-dom";

const DashboardPage: React.FC = () => {
    return (
        <section className="mt-4">
            <h2>Dashboard</h2>

            <div className="d-grid">
                <div className="card">
                    <div className="card-body">
                        <h5 className="card-title">Chatters</h5>
                        <p className="card-text">
                            Display user list that comment on this session
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
                        <h5 className="card-title">Chatters</h5>
                        <p className="card-text">
                            Display user list that comment on this session
                        </p>
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
