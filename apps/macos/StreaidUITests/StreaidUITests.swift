import XCTest

final class StreaidUITests: XCTestCase {
    /// The app must render the login screen without touching Keychain or
    /// binding the overlay port.
    func testJapaneseLoginScreenRenders() throws {
        let app = XCUIApplication()
        app.launchEnvironment["STREAID_SKIP_AUTH"] = "1"
        app.launchEnvironment["STREAID_DISABLE_BACKGROUND"] = "1"
        app.launchEnvironment["STREAID_FORCE_LOCALE"] = "ja"
        app.launch()

        XCTAssertTrue(
            app.staticTexts["Twitchアカウントを接続"].waitForExistence(timeout: 10),
            "Japanese login heading should appear"
        )
        XCTAssertTrue(
            app.buttons["Twitchでログイン"].waitForExistence(timeout: 10),
            "Japanese login button should appear"
        )
    }

    func testLoginScreenRenders() throws {
        let app = XCUIApplication()
        app.launchEnvironment["STREAID_SKIP_AUTH"] = "1"
        app.launchEnvironment["STREAID_DISABLE_BACKGROUND"] = "1"
        app.launch()

        XCTAssertTrue(
            app.staticTexts["Streaid"].waitForExistence(timeout: 10),
            "app title should appear"
        )
        XCTAssertTrue(
            app.buttons["Log in with Twitch"].waitForExistence(timeout: 10),
            "login button should be visible"
        )
        XCTAssertTrue(
            app.textFields.firstMatch.exists,
            "Client ID field should be visible"
        )
    }
}
