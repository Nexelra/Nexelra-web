import { createBrowserRouter, Outlet } from "react-router-dom";

import IgntHeader from "../components/ignt/IgntHeader";
import DataView from "../views/DataView";
import PortfolioView from "../views/PortfolioView";
import WalletView from "../views/WalletView";
import SendView from "../views/SendView";
import IdentityView from "../views/IdentityView"; 

const items = [
	{
		label: "Portfolio",
		to: "/",
	},
	{
		label: "Wallet",
		to: "/wallet",
	},
	{
		label: "Send",
		to: "/send",
	},
	{
		label: "Identity",
		to: "/identity",
	},
	{
		label: "Data",
		to: "/data",
	},
];

const Layout = () => {
	return (
		<>
			<IgntHeader navItems={items} />
			<Outlet />
		</>
	);
};

const router = createBrowserRouter([
	{
		path: "/",
		element: <Layout />,
		children: [
			{ path: "/", element: <PortfolioView /> },
			{ path: "/wallet", element: <WalletView /> },
			{ path: "/send", element: <SendView /> },
			{ path: "/identity", element: <IdentityView /> }, 
			{ path: "/data", element: <DataView /> },
		],
	},
]);

export default router;