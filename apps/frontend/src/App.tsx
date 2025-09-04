// Main App Component

import { AuthProvider } from './app/providers/AuthProvider';
import { AppRoutes } from './app/routes/AppRoutes';
import { PricingProvider } from './contexts/PricingContext';
import { ToastProvider } from './providers/ToastProvider';

function App() {
	return (
		<AuthProvider>
			<PricingProvider>
				<ToastProvider>
					<AppRoutes />
				</ToastProvider>
			</PricingProvider>
		</AuthProvider>
	);
}

export default App;
