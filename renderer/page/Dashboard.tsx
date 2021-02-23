import React from "react";
import { Link } from "react-router-dom";

const DashboardPage: React.FC = () => {
    return (
        <section className="my-4">
            <h2 className="display-4 mb-4 py-4 text-center fw-bolder">
                <i className="bi bi-twitch me-2"></i>
                Twitch Support Tool
            </h2>

            <div
                className="d-grid gap-3"
                style={{
                    gridTemplateColumns:
                        "repeat(auto-fill, minmax(280px, 1fr))",
                }}
            >
                <div className="card">
                    <div className="card-body">
                        <h5 className="card-title">
                            <i className="bi bi-chat me-2"></i>
                            Chatters
                        </h5>
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
                        <h5 className="card-title">
                            <i className="bi bi-tornado me-2"></i>
                            Raiders
                        </h5>
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
                        <h5 className="card-title">
                            <i className="bi bi-display me-2"></i>
                            Hosts
                        </h5>
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
                        <h5 className="card-title">
                            <i className="bi bi-camera-reels me-2"></i>
                            Channel
                        </h5>
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
            </div>
        </section>
    );
};

export default DashboardPage;
