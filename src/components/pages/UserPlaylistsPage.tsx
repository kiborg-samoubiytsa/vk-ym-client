import { UserPlaylists } from "../containers/UserPlaylists";
import { SideBar } from "../Sidebar/Sidebar";

export const UserPlaylistsPage = () => {
  return (
    <div className="User-Collection">
      <UserPlaylists />
      <SideBar />
    </div>
  );
};
