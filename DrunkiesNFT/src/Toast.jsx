import React from "react";

const Toast = ({ message, type, duration = 3000, messageController }) => {
	const [show, setShow] = React.useState(true);

	const toastClass = () => {
		switch (type) {
			case "success":
				return "bg-green-500";
			case "error":
				return "bg-red-500";
			default:
				return "bg-gray-500";
		}
	};

	React.useEffect(() => {
		const timeout = setTimeout(() => {
			setShow(false);
		}, duration);

		return () => {
			clearTimeout(timeout);
      messageController();
		};
	}, [show]);

	return (
		<>
			{show && (
				<div
					className={`fixed top-1 left-1/2 transform -translate-x-1/2 w-64 p-4 rounded-md text-white ${toastClass()} transition ease-in duration-500 z-50`}
				>
					<p className="text-center font-medium">{message}</p>
				</div>
			)}
		</>
	);
};
export default Toast;
