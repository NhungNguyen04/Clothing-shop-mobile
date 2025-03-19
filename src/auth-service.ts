import * as WebBrowser from "expo-web-browser"
import { Linking } from "react-native"

// Hardcode the API URL instead of using process.env
const API_URL = "https://clothing-shop-be-production.up.railway.app" // Replace with your actual backend URL
const DEEP_LINK_SCHEME = "nh-clothing://" 

export class AuthService {
  static async loginWithGoogle(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log("Starting Google login flow...")

      // Create a promise that will be resolved when we get the deep link callback
      let resolveAuthPromise: (value: any) => void
      let rejectAuthPromise: (reason?: any) => void

      const authPromise = new Promise<{ success: boolean; data?: any; error?: string }>((resolve, reject) => {
        resolveAuthPromise = resolve
        rejectAuthPromise = reject
      })

      // Set up deep link listener
      const handleUrl = async (event: { url: string }) => {
        const url = event.url
        console.log("Deep link received:", url)

        // Remove the listener
        subscription.remove()

        // Parse the URL to extract token or error
        if (url.includes("token=")) {
          const token = url.split("token=")[1].split("&")[0]

          try {
            // Fetch user data using the token
            console.log("Fetching user data with token...")
            const response = await fetch(`${API_URL}/auth/me`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            })

            if (!response.ok) {
              console.error("Failed to fetch user data:", await response.text())
              throw new Error("Failed to fetch user data")
            }

            const userData = await response.json()
            console.log("User data received:", userData)

            resolveAuthPromise({
              success: true,
              data: {
                access_token: token,
                user: userData,
              },
            })
          } catch (error) {
            console.error("Error processing token:", error)

            // If we can't fetch user data, try to decode the JWT token
            try {
              const base64Url = token.split(".")[1]
              const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
              const jsonPayload = decodeURIComponent(
                atob(base64)
                  .split("")
                  .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                  .join(""),
              )

              const payload = JSON.parse(jsonPayload)
              const userData = {
                id: payload.sub,
                email: payload.email,
                name: payload.name || "User",
              }

              resolveAuthPromise({
                success: true,
                data: {
                  access_token: token,
                  user: userData,
                },
              })
            } catch (e) {
              console.error("Error decoding JWT:", e)
              rejectAuthPromise(error)
            }
          }
        } else if (url.includes("error=")) {
          const error = url.split("error=")[1].split("&")[0]
          console.error("Auth error from URL:", decodeURIComponent(error))
          rejectAuthPromise(new Error(decodeURIComponent(error)))
        }
      }

      // Add deep link listener
      const subscription = Linking.addEventListener("url", handleUrl as any)

      // Construct the auth URL with platform=mobile and redirectUri
      const redirectUri = encodeURIComponent(DEEP_LINK_SCHEME + "auth")
      const authUrl = `${API_URL}/auth/google?platform=mobile&redirectUri=${redirectUri}`

      console.log("Opening auth URL:", authUrl)

      // Open browser for authentication
      const result = await WebBrowser.openAuthSessionAsync(authUrl, DEEP_LINK_SCHEME + "auth")
      console.log("WebBrowser result:", result)

      if (result.type !== "success" && result.type !== "cancel") {
        // If the browser was closed without completing auth
        subscription.remove()
        return { success: false, error: "Authentication was cancelled" }
      }

      // Wait for the deep link callback to resolve the promise
      return await authPromise
    } catch (error) {
      console.error("Google login error:", error)
      return { success: false, error: error instanceof Error ? error.message : "Authentication failed" }
    }
  }

  // Add a method to test deep linking
  static async testDeepLink(): Promise<boolean> {
    try {
      const testUrl = `${DEEP_LINK_SCHEME}test?param=value`
      const supported = await Linking.canOpenURL(testUrl)

      if (supported) {
        console.log("Deep linking is supported")
        await Linking.openURL(testUrl)
        return true
      } else {
        console.error("Deep linking is not supported")
        return false
      }
    } catch (error) {
      console.error("Error testing deep link:", error)
      return false
    }
  }
}

