import SwiftUI

/// Palette from the original Streaid theme.
enum Theme {
    static let background = Color(hex: 0x0F0F14)
    static let sidebar = Color(hex: 0x0B0B10)
    static let card = Color.white.opacity(0.05)
    static let cardStrong = Color(hex: 0x15151D)
    static let border = Color.white.opacity(0.10)
    static let borderStrong = Color(hex: 0x9146FF).opacity(0.30)

    static let purple = Color(hex: 0x9146FF)
    static let purpleHover = Color(hex: 0xA970FF)
    static let purpleDim = Color(hex: 0x8D78FD)
    static let purpleDark = Color(hex: 0x6534ED)
    static let purpleLight = Color(hex: 0xC4B5FD)

    static let textPrimary = Color(hex: 0xEFEFF1)
    static let textMuted = Color(hex: 0xADADB8)
    static let textDim = Color(hex: 0x9CA3AF)

    static let green = Color(hex: 0x4ADE80)
    static let yellow = Color(hex: 0xFACC15)
    static let red = Color(hex: 0xF87171)
    static let blue = Color(hex: 0x60A5FA)

    static let sidebarWidth: CGFloat = 220
    static let cornerRadius: CGFloat = 14
}

extension Color {
    init(hex: UInt32, opacity: Double = 1.0) {
        self.init(
            .sRGB,
            red: Double((hex >> 16) & 0xFF) / 255.0,
            green: Double((hex >> 8) & 0xFF) / 255.0,
            blue: Double(hex & 0xFF) / 255.0,
            opacity: opacity
        )
    }
}
