import React from "react";

function InputField(props) {
	const handleChange = (event) => {
		props.onChange(event.target.value);
	};

	return (
		<input
			type={props.type}
			name={props.name}
			placeholder={props.placeholder}
			value={props.value}
			onChange={handleChange}
			className="border rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
		/>
	);
}
export default InputField;
