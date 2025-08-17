import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Entry } from './routes/Entry.tsx';
import { Error404 } from './routes/Error404.tsx';
import { ApiStatus } from './routes/status/Api.tsx';
import { MongoStatus } from './routes/status/Mongo.tsx';
import { StatusEntry } from './routes/status/StatusEntry.tsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/">
          <Route index element={<Entry />} />
          <Route path="*" element={<Error404 />} />
        </Route>

        <Route path="/status">
          <Route index element={<StatusEntry />} />
          <Route path="api" element={<ApiStatus />} />
          <Route path="mongo" element={<MongoStatus />} />
          <Route path="*" element={<Error404 />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
