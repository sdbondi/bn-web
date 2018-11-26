import React, { Component } from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";
import { Typography } from "@material-ui/core";
import classNames from "classnames";
import moment from "moment";

import TicketTypeSalesBarChart from "../../../../elements/charts/TicketTypeSalesBarChart";
import Card from "../../../../elements/Card";
import Divider from "../../../../common/Divider";
import { fontFamilyDemiBold } from "../../../../styles/theme";
import VerticalBarChart from "../../../../elements/charts/VerticalBarChart";
import Container from "./Container";
import Bigneon from "../../../../../helpers/bigneon";
import notifications from "../../../../../stores/notifications";

const styles = theme => {
	return {
		numbersCardContent: {
			display: "flex",
			flexDirection: "column",
			justifyContent: "center",
			padding: theme.spacing.unit * 2,
			height: 100
		},
		numbersCardContentActive: {
			backgroundColor: theme.palette.primary.main
		},
		numbersCardLabel: {
			color: "#868f9b",
			textTransform: "uppercase",
			fontSize: theme.typography.fontSize * 0.8,
			fontFamily: fontFamilyDemiBold
		},
		numbersCardRow: {
			display: "flex",
			alignContent: "flex-start"
		},
		numbersCardValue: {
			fontSize: theme.typography.fontSize * 2.2
		},
		numbersCardActiveText: {
			color: "#FFFFFF"
		},
		numbersCardIcon: {
			width: 28,
			marginRight: theme.spacing.unit,
			marginBottom: theme.spacing.unit
		}
	};
};

const NumberCard = ({ classes, label, active, value, iconName }) => {
	return (
		<Card variant="subCard">
			<div
				className={classNames({
					[classes.numbersCardContent]: true,
					[classes.numbersCardContentActive]: !!active
				})}
			>
				<Typography
					className={classNames({
						[classes.numbersCardLabel]: true,
						[classes.numbersCardActiveText]: !!active
					})}
				>
					{label}
				</Typography>

				<div className={classes.numbersCardRow}>
					<img
						className={classes.numbersCardIcon}
						src={`/icons/${iconName}-${active ? "white" : "active"}.svg`}
						alt={iconName}
					/>
					<Typography
						className={classNames({
							[classes.numbersCardValue]: true,
							[classes.numbersCardActiveText]: !!active
						})}
					>
						{value}
					</Typography>
				</div>
			</div>
		</Card>
	);
};

class Summary extends Component {
	constructor(props) {
		super(props);

		this.state = {
			event: null,
			activeNumbersCard: null,
			chartValues: [],
			last30Days: []
		};
	}

	componentDidMount() {
		//TODO make bn-api issue for date required
		this.setState({ chartValues: this.getDailyBreakdownValues() });

		this.loadEventDetails(this.props.match.params.id);
	}

	loadEventDetails(eventId) {
		Bigneon()
			.events.dashboard({ id: eventId })
			.then(response => {
				const { last_30_days, event } = response.data;

				this.setState({
					event,
					last30Days: last_30_days
				});
			})
			.catch(error => {
				console.error(error);
				this.setState({ isSubmitting: false });

				let message = "Loading event details failed.";
				if (
					error.response &&
					error.response.data &&
					error.response.data.error
				) {
					message = error.response.data.error;
				}

				notifications.show({
					message,
					variant: "error"
				});
			});
	}

	getDailyBreakdownValues() {
		let result = [];

		const { last30Days } = this.state;

		for (let index = 0; index < last30Days.length; index++) {
			result.push({
				x: moment(last30Days[index].date).format("D"),
				y: last30Days[index].sales / 100,
				tooltipTitle: `$${Math.floor(last30Days[index].sales / 100)}`,
				tooltipText: `${last30Days[index].tickets_sold} Tickets`
			});
		}

		return result;
	}

	renderBarChart() {
		const { chartValues } = this.state;
		return <VerticalBarChart values={chartValues} />;
	}

	renderNumbers() {
		const { activeNumbersCard, event } = this.state;
		const { classes } = this.props;

		return (
			<Grid container spacing={32}>
				<Grid
					item
					xs={12}
					sm={6}
					lg={3}
					onMouseEnter={() => this.setState({ activeNumbersCard: "revenue" })}
					onMouseLeave={() => this.setState({ activeNumbersCard: null })}
				>
					<NumberCard
						active={activeNumbersCard === "revenue"}
						label="Revenue"
						value={"$" + Math.floor(event.sales_total_in_cents / 100)}
						iconName="chart"
						classes={classes}
					/>
				</Grid>
				<Grid
					item
					xs={12}
					sm={6}
					lg={3}
					onMouseEnter={() => this.setState({ activeNumbersCard: "sold" })}
					onMouseLeave={() => this.setState({ activeNumbersCard: null })}
				>
					<NumberCard
						active={activeNumbersCard === "sold"}
						label="Tickets sold"
						value={event.sold_held + event.sold_unreserved}
						iconName="ticket"
						classes={classes}
					/>{" "}
				</Grid>
				<Grid
					item
					xs={12}
					sm={6}
					lg={3}
					onMouseEnter={() => this.setState({ activeNumbersCard: "open" })}
					onMouseLeave={() => this.setState({ activeNumbersCard: null })}
				>
					<NumberCard
						active={activeNumbersCard === "open"}
						label="Tickets open"
						value={event.tickets_open}
						iconName="ticket"
						classes={classes}
					/>
				</Grid>
				<Grid
					item
					xs={12}
					sm={6}
					lg={3}
					onMouseEnter={() => this.setState({ activeNumbersCard: "daysLeft" })}
					onMouseLeave={() => this.setState({ activeNumbersCard: null })}
				>
					<NumberCard
						active={activeNumbersCard === "daysLeft"}
						label="Days left"
						value={moment(event.event_start).diff(moment(), "days")}
						iconName="events"
						classes={classes}
					/>
				</Grid>
			</Grid>
		);
	}

	renderTicketVolumes() {
		const ticketTypes = this.state.event.ticket_types;

		return (
			<Grid container spacing={32}>
				{ticketTypes.map((tt, index) => (
					<Grid key={index} item xs={12} sm={6} lg={4}>
						<TicketTypeSalesBarChart
							name={tt.name}
							totalRevenue={Math.floor(tt.sales_total_in_cents / 100)}
							values={[
								{ label: "Sold", value: tt.sold_held + tt.sold_unreserved },
								{ label: "Open", value: tt.open },
								{ label: "Held", value: tt.held }
							]}
						/>
					</Grid>
				))}
			</Grid>
		);
	}

	render() {
		const { event } = this.state;

		if (!event) {
			return <Typography>Loading...</Typography>;
		}

		return (
			<Container eventId={event.id} subheading={"summary"}>
				{this.renderBarChart()}

				<div style={{ marginTop: 60 }} />

				{this.renderNumbers()}

				<Divider style={{ marginTop: 40, marginBottom: 40 }} />

				<Typography variant="title">Ticket Volumes</Typography>
				{this.renderTicketVolumes()}
			</Container>
		);
	}
}

export default withStyles(styles)(Summary);