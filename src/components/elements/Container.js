import React from "react";
import PropTypes from "prop-types";
import { observer } from "mobx-react";
import { withRouter } from "react-router-dom";
import { Link } from "react-router-dom";
// import DevTools from "mobx-react-devtools";
import classnames from "classnames";
import { withStyles } from "@material-ui/core/styles";
import Drawer from "@material-ui/core/Drawer";
import Grid from "@material-ui/core/Grid";
import SwipeableDrawer from "@material-ui/core/SwipeableDrawer";
import Hidden from "@material-ui/core/Hidden";

import AppBar from "./header/AppBar";
import MenuContent from "./menu/MenuContent";
import Notification from "../common/Notification";
import user from "../../stores/user";
import CartMobileBottomBar from "../common/cart/CartMobileBottomBar";
import RequiresAuthDialog from "../pages/authentication/RequiresAuthDialog";
import { toolBarHeight } from "../../components/styles/theme";
import layout from "../../stores/layout";
import BoxOfficeAppBar from "./header/BoxOfficeAppBar";
import Footer from "./footers/FooterOne";

const drawerWidth = 240;

const styles = theme => ({
	root: {
		flexGrow: 1,
		height: "100%",
		zIndex: 1,
		overflow: "hidden",
		position: "relative",
		display: "flex",
		width: "100%"
	},
	toolbar: toolBarHeight,
	drawerPaper: {
		//width: layout.adminStyleMenu ? 60 : drawerWidth,
		minHeight: window.innerHeight * 1.1,
		[theme.breakpoints.up("md")]: {
			position: "relative"
		}
	},
	content: {
		flexGrow: 1,
		backgroundColor: theme.palette.background.default
	},
	footerPlaceholder: {
		paddingBottom: theme.spacing.unit * 10
	},
	paddedContent: {
		padding: theme.spacing.unit * 3
	},
	boxOfficePaddedContainer: {
		padding: theme.spacing.unit * 3,
		paddingTop: theme.spacing.unit * 4
	}
});

@observer
class Container extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			mobileOpen: false
			//isWidget: false
		};
	}

	componentDidMount() {
		//This component mounts every time the browser is refreshed, so we need to check we still have a valid token
		user.refreshUser();
	}

	handleDrawerToggle() {
		this.setState(state => ({ mobileOpen: !state.mobileOpen }));
	}

	render() {
		const {
			showSideMenu,
			includeContainerPadding,
			useContainer,
			isBoxOffice
		} = layout;
		const { classes, history, children } = this.props;
		const { mobileOpen } = this.state;

		//Don't render container things if we're in a widget
		if (!useContainer) {
			return (
				<div>
					{children}
					<Notification />
				</div>
			);
		}

		const drawer = (
			<MenuContent toggleDrawer={this.handleDrawerToggle.bind(this)} />
		);

		const drawStyle = {};
		if (layout.adminStyleMenu === null) {
			drawStyle.display = "none";
		} else if (layout.adminStyleMenu) {
			drawStyle.width = 80;
		} else {
			drawStyle.width = drawerWidth;
		}

		return (
			<div>
				{isBoxOffice ? (
					<BoxOfficeAppBar
						handleDrawerToggle={this.handleDrawerToggle.bind(this)}
						history={history}
					/>
				) : (
					<AppBar
						handleDrawerToggle={this.handleDrawerToggle.bind(this)}
						history={history}
					/>
				)}

				<div className={classes.root}>
					<Hidden mdUp>
						<SwipeableDrawer
							variant="temporary"
							anchor={"left"}
							open={mobileOpen}
							onOpen={this.handleDrawerToggle.bind(this)}
							onClose={this.handleDrawerToggle.bind(this)}
							classes={{
								paper: classes.drawerPaper
							}}
							ModalProps={{
								keepMounted: true // Better open performance on mobile.
							}}
							PaperProps={{
								style: drawStyle
							}}
						>
							{drawer}
						</SwipeableDrawer>
					</Hidden>
					{showSideMenu ? (
						<Hidden smDown implementation="css">
							<Drawer
								variant="permanent"
								open
								classes={{
									paper: classes.drawerPaper
								}}
								PaperProps={{
									style: drawStyle
								}}
							>
								{drawer}
							</Drawer>
						</Hidden>
					) : null}
					<main
						className={classnames({
							[classes.content]: true,
							[classes.paddedContent]: includeContainerPadding
						})}
					>
						<div className={classes.toolbar} />

						<Grid
							container
							spacing={0}
							direction="row"
							justify="center"
							alignItems="center"
						>
							<Grid
								item
								xs={12}
								sm={12}
								md={12}
								lg={includeContainerPadding ? 9 : 12}
								className={classnames({
									[classes.boxOfficePaddedContainer]: isBoxOffice
								})}
							>
								{children}
							</Grid>
						</Grid>

						<RequiresAuthDialog
							onAuthSuccess={() => user.onSuccessAuthRequiredDialog()}
							open={user.showRequiresAuthDialog}
							onClose={() => user.hideAuthRequiredDialog()}
						/>
						<Notification />

						{layout.showFooter ? (
							<Footer />
						) : (
							<div className={classes.footerPlaceholder} />
						)}
					</main>
				</div>
				<CartMobileBottomBar />
			</div>
		);
	}
}

Container.propTypes = {
	classes: PropTypes.object.isRequired,
	children: PropTypes.element.isRequired
};

export default withStyles(styles)(withRouter(Container));
