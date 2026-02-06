import { BrowserRouter, Routes, Route } from "react-router-dom";

import CreateComplaint from "./pages/CreateComplaint";
import ChatPage from "./pages/ChatPage";
import ComplaintTable from "./pages/Complaindata";
import UserChatPage from "./pages/UserChatPage";
import QRGenerator from "./pages/QRGenerator";
import SupportLayout from "./components/SupportLayout";
// import useKeyboardSound from "./Hooks/useKeyboardSound";

import { Toaster } from "react-hot-toast";

function App() {
  //  🔊 Optional: Global Keyboard Sound
  // useKeyboardSound("/sounds/typing.mp3", 0.5);

  return (
    <BrowserRouter>
      <Toaster position="top-center" reverseOrder={false} />
      <Routes>
        {/* User Routes */}
        <Route path="/" element={<CreateComplaint />} />
        <Route path="/createcomplaint" element={<CreateComplaint />} />
        <Route path="/userchat" element={<UserChatPage />} />

        {/* Support Routes with Layout */}
        <Route element={<SupportLayout />}>
          <Route path="/support" element={<ChatPage />} />
          <Route path="/complaints" element={<ComplaintTable />} />
          <Route path="/qr-manager" element={<QRGenerator />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
