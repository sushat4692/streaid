import Foundation

/// Formats serde/chrono RFC3339 timestamps for the log rows.
enum EventTime {
    static func clock(_ timestamp: String) -> String {
        guard let date = parse(timestamp) else { return "" }
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm:ss"
        return formatter.string(from: date)
    }

    private static func parse(_ timestamp: String) -> Date? {
        // chrono emits up to 6 fractional digits; ISO8601DateFormatter is
        // happiest with 3, so trim the rest before parsing.
        let normalized = timestamp.replacingOccurrences(
            of: #"(\.\d{3})\d+"#,
            with: "$1",
            options: .regularExpression
        )

        let withFraction = ISO8601DateFormatter()
        withFraction.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let date = withFraction.date(from: normalized) {
            return date
        }

        let plain = ISO8601DateFormatter()
        plain.formatOptions = [.withInternetDateTime]
        return plain.date(from: normalized)
    }
}
