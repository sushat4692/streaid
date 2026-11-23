import Foundation

// Entry point. The core must be initialized on the main thread, so create it
// here before blocking on the semaphore.
let core = StreaidCore()
let result = ContractResult()
let semaphore = DispatchSemaphore(value: 0)

Task {
    do {
        try runDecodingTests()
        try await runCoreTests(core)
    } catch {
        result.error = error
    }
    semaphore.signal()
}

semaphore.wait()

if let error = result.error {
    fatalError("Swift FFI contract test failed: \(error)")
}

print("Swift FFI contract test: OK")
