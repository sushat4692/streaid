import React from "react";
import { useRecoilState, useSetRecoilState } from "recoil";
import { FormattedMessage, useIntl } from "react-intl";
import Select from "react-select";

// Recoil
import LocaleState from "../atom/Locale";
import IsInitedState from "../atom/IsInited";

// Component
import MetaComponent from "../component/Meta";

// Utils
import { request } from "../util/request";

// Const
import { list as localeList } from "../const/locales";

// Style
import styles from "./Init.module.css";

const InitComponent: React.FC = () => {
    const intl = useIntl();
    const [locale, updateLocate] = useRecoilState(LocaleState);
    const updateIsInited = useSetRecoilState(IsInitedState);
    const defaultLocale = localeList.find((e) => e.value === locale);

    const updateLocaleHandler = async (e: { label: string; value: string }) => {
        updateLocate(e.value);
        await request("setting:locale:update", e.value, null);
    };

    const clickHandler = async () => {
        await request("setting:get", {}, null);
        updateIsInited(true);
    };

    return (
        <div className="container-fluid">
            <MetaComponent />

            <section className={styles.wrap}>
                <div>
                    <h2 className={styles.title}>
                        <i className={`bi bi-twitch ${styles.title__icon}`} />
                        <FormattedMessage
                            id="Common.Title"
                            defaultMessage="Twitch Support Tool"
                        />
                    </h2>

                    <div className={styles.form}>
                        <h2 className={styles.form__label}>
                            <FormattedMessage
                                id="View.Init.Header"
                                defaultMessage="Signin to Twitch"
                            />
                        </h2>

                        <div className={styles.form__select}>
                            <Select
                                name="language"
                                id="language"
                                classNamePrefix="react-select"
                                defaultValue={defaultLocale}
                                options={localeList}
                                onChange={updateLocaleHandler}
                                placeholder={intl.formatMessage({
                                    id: "Common.Select.Placeholder",
                                    defaultMessage: "Select...",
                                })}
                            />
                        </div>

                        <button
                            className="btn is-block is-large is-primary"
                            onClick={clickHandler}
                        >
                            <FormattedMessage
                                id="Common.SignIn"
                                defaultMessage="Signin"
                            />
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default InitComponent;
