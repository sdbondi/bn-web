import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import { fontFamilyDemiBold } from "../../styles/theme";
import classNames from "classnames";

const styles = theme => {
	return {
		root: {
			cursor: "pointer",
			marginRight: theme.spacing.unit * 2,
			display: "flex"
		},
		label: { color: "#868f9b" },
		labelActive: {
			fontFamily: fontFamilyDemiBold
		},
		square: {
			marginRight: theme.spacing.unit,
			borderStyle: "solid",
			borderColor: "#9da3b4",
			backgroundColor: "#afc6d4",
			opacity: 0.2,
			width: 20,
			height: 20,
			borderWidth: 0.5,
			borderRadius: 4
		},
		activeSquare: {
			backgroundImage: "linear-gradient(229deg, #e53d96, #5491cc)",
			marginRight: theme.spacing.unit,
			width: 20,
			height: 20,
			borderRadius: 4,
			display: "flex",
			justifyContent: "center",
			alignItems: "center"
		},
		disabledRoot: {
			cursor: "default"
		},
		disabledActiveSquare: {
			backgroundImage:
				"linear-gradient(229deg, rgb(229,61,150,0.5), rgb(84,145,204,0.5))"
		},
		checkmark: {
			width: 12,
			height: 12
		}
	};
};

const CheckBox = ({
	active,
	children,
	onClick,
	classes,
	disabled,
	style = {}
}) => {
	return (
		<div
			className={classNames({
				[classes.root]: true,
				[classes.disabledRoot]: !!disabled
			})}
			onClick={!disabled ? onClick : null}
			style={style}
		>
			{active ? (
				<div
					className={classNames({
						[classes.activeSquare]: true,
						[classes.disabledActiveSquare]: !!disabled
					})}
				>
					<img className={classes.checkmark} src="/icons/checkmark-white.svg" />
				</div>
			) : (
				<div className={classes.square} />
			)}
			{children ? (
				<Typography className={classes[active ? "labelActive" : "label"]}>
					{children}
				</Typography>
			) : null}
		</div>
	);
};

CheckBox.propTypes = {
	active: PropTypes.bool.isRequired,
	children: PropTypes.string,
	classes: PropTypes.object.isRequired,
	onClick: PropTypes.func,
	disabled: PropTypes.bool,
	style: PropTypes.object
};

export default withStyles(styles)(CheckBox);
