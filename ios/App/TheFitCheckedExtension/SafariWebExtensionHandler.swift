import SafariServices
import Foundation

class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling {
    
    func beginRequest(with context: NSExtensionContext) {
        let request = context.inputItems.first as? NSExtensionItem
        
        guard let message = request?.userInfo?[SFExtensionMessageKey] as? [String: Any],
              let action = message["action"] as? String else {
            context.completeRequest(returningItems: [], completionHandler: nil)
            return
        }
        
        switch action {
        case "getSession":
            getSession { session in
                let response = NSExtensionItem()
                response.userInfo = [
                    SFExtensionMessageKey: [
                        "session": session ?? ""
                    ]
                ]
                context.completeRequest(returningItems: [response], completionHandler: nil)
            }
            
        default:
            context.completeRequest(returningItems: [], completionHandler: nil)
        }
    }
    
    // Get session from Capacitor Preferences via App Group
    private func getSession(completion: @escaping (String?) -> Void) {
        // Access shared UserDefaults via App Group
        // Replace with your actual App Group identifier
        let userDefaults = UserDefaults(suiteName: "com.thefitchecked.app")
        
        // Capacitor stores preferences with this key format
        let session = userDefaults?.string(forKey: "CapacitorStorage.supabase_session")
        completion(session)
    }
}
