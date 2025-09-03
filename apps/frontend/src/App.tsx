// Main App Component

import { AppRoutes } from './app/routes/AppRoutes';
import { ToastProvider } from './providers/ToastProvider';

function App() {
	return (
		<ToastProvider>
			<AppRoutes />
		</ToastProvider>
	);
}

export default App;
