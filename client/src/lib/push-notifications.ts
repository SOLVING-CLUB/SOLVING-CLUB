// Push Notifications setup for Capacitor
// This file provides a basic structure for push notifications
// To enable push notifications, install @capacitor/push-notifications and configure it

// Helper to check if Capacitor is available
async function getCapacitor() {
	try {
		const { Capacitor } = await import('@capacitor/core');
		return Capacitor;
	} catch (e) {
		return null;
	}
}

export interface PushNotificationPayload {
	title: string;
	body: string;
	data?: Record<string, any>;
}

class PushNotificationService {
	private isAvailable = false;

	async initialize() {
		// Check if Capacitor is available
		const Capacitor = await getCapacitor();
		
		// Only available on native platforms
		if (!Capacitor || !Capacitor.isNativePlatform()) {
			console.log('Push notifications are only available on native platforms');
			return;
		}

		try {
			// Dynamic import to avoid errors on web
			const { PushNotifications } = await import('@capacitor/push-notifications');
			
			// Request permission
			let permResult = await PushNotifications.requestPermissions();
			if (permResult.receive === 'granted') {
				this.isAvailable = true;
				
				// Register with Apple / Google to receive push notifications
				await PushNotifications.register();
				
				// Listen for registration
				PushNotifications.addListener('registration', (token) => {
					console.log('Push registration success, token: ' + token.value);
					// Store token in Supabase or your backend
					this.storeToken(token.value);
				});
				
				// Listen for registration errors
				PushNotifications.addListener('registrationError', (error) => {
					console.error('Error on registration: ' + JSON.stringify(error));
				});
				
				// Listen for push notifications
				PushNotifications.addListener('pushNotificationReceived', (notification) => {
					console.log('Push notification received: ', notification);
					// Handle notification display
				});
				
				// Listen for notification actions
				PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
					console.log('Push notification action performed', action.actionId, action.inputValue);
				});
			} else {
				console.log('Push notification permission denied');
			}
		} catch (error) {
			console.error('Push notifications not available:', error);
		}
	}

	private async storeToken(token: string) {
		// Store the push token in Supabase or your backend
		// This allows you to send push notifications to this device
		const { getSupabaseClient } = await import('./supabase');
		const supabase = getSupabaseClient();
		const { data: { user } } = await supabase.auth.getUser();
		
		if (user) {
			// You would typically store this in a user_devices table
			// For now, we'll just log it
			console.log('Store token for user:', user.id, token);
		}
	}

	isNotificationAvailable(): boolean {
		return this.isAvailable;
	}
}

export const pushNotificationService = new PushNotificationService();

// Initialize on app start (only on native platforms)
if (typeof window !== 'undefined') {
	// Initialize after a short delay to ensure Capacitor is ready
	setTimeout(async () => {
		const Capacitor = await getCapacitor();
		if (Capacitor && Capacitor.isNativePlatform()) {
			pushNotificationService.initialize();
		}
	}, 1000);
}

