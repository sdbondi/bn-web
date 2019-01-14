import { observable, computed, action } from "mobx";
import notifications from "./notifications";
import Bigneon from "../helpers/bigneon";
import user from "./user";

const itemListToSave = selectedTickets => {
	const ticketIds = Object.keys(selectedTickets);

	let items = [];
	ticketIds.forEach(id => {
		const quantity = parseInt(selectedTickets[id].quantity);
		items.push({
			ticket_type_id: id,
			quantity,
			redemption_code: selectedTickets[id].redemption_code
		});
	});

	return items;
};

class Cart {
	@observable
	id = null; //Cart ID

	@observable
	items = [];

	@observable
	total_in_cents = 0;

	@observable
	seconds_until_expiry = null;

	@observable
	latestEventId = null;

	cartExpiryTicker = null;

	startExpiryTicker() {
		if (this.cartExpiryTicker) {
			clearInterval(this.cartExpiryTicker);
		}

		this.cartExpiryTicker = setInterval(() => {
			if (!this.seconds_until_expiry || this.seconds_until_expiry < 1) {
				clearInterval(this.cartExpiryTicker);
				this.refreshCart();
			} else {
				this.seconds_until_expiry--;

				//Refresh the cart from server every 30 seconds as JS can be paused in browsers
				if (this.seconds_until_expiry % 30 === 0) {
					this.refreshCart();
				}
			}
		}, 1000);
	}

	@action
	refreshCart(onSuccess) {
		//Right now carts only work for authed users
		if (!user.isAuthenticated) {
			this.emptyCart();
			return;
		}

		Bigneon()
			.cart.read()
			.then(response => {
				const { data } = response;
				if (data) {
					this.replaceCartData(data, onSuccess);

					const latestEventId = localStorage.getItem("latestEventIdCart");
					if (latestEventId) {
						this.setLatestEventId(latestEventId);
					}
				}
			})
			.catch(error => {
				console.error(error);

				let message = "Loading cart details failed.";
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

	replaceCartData(data, callback) {
		const { id, items, total_in_cents, seconds_until_expiry } = data;
		this.id = id;
		this.items = items;
		this.total_in_cents = total_in_cents;

		if (seconds_until_expiry) {
			this.seconds_until_expiry = seconds_until_expiry;
			this.startExpiryTicker();
		} else {
			this.seconds_until_expiry = null;
		}
		callback ? callback() : null;
	}

	@action
	applyPromo(promoCode) {
		this.redemptionCode = promoCode;
	}

	@action
	setLatestEventId(latestEventId) {
		//This is required for users to be able to click on the cart link and go to the page where last were
		this.latestEventId = latestEventId;
		localStorage.setItem("latestEventIdCart", latestEventId);
	}

	@action
	update(selectedTickets, onSuccess, onError) {
		const items = itemListToSave(selectedTickets);
		Bigneon()
			.cart.update({ items, redemption_code: this.redemptionCode })
			.then(response => {
				const { data } = response;
				if (data) {
					this.replaceCartData(data);
				}
				onSuccess();
			})
			.catch(error => {
				console.error(error);
				onError(error);
			});
	}

	@action
	replace(selectedTickets, onSuccess, onError) {
		const items = itemListToSave(selectedTickets);

		Bigneon()
			.cart.replace({ items, redemption_code: this.redemptionCode })
			.then(response => {
				const { data } = response;
				if (data) {
					this.replaceCartData(data);
				}
				onSuccess();
			})
			.catch(error => {
				console.error(error);
				onError(error);
			});
	}

	@action
	emptyCart() {
		//TODO delete from cart using API first
		this.items = [];
		this.redemptionCode = null;
		this.id = null;
		this.total_in_cents = 0;
	}

	@computed
	get ticketCount() {
		if (!this.items) {
			return 0;
		}

		let count = 0;
		this.items.forEach(({ item_type, quantity }) => {
			if (item_type === "Tickets") {
				count = count + quantity;
			}
		});

		return count;
	}

	@computed
	get fees() {
		if (!this.items) {
			return 0;
		}

		let fees = 0;
		this.items.forEach(item => {
			const { item_type, quantity, unit_price_in_cents } = item;
			if (item_type === "Fees") {
				fees = fees + unit_price_in_cents * quantity;
			}
		});

		return fees / 100;
	}

	@computed
	get formattedExpiryTime() {
		if (!this.seconds_until_expiry) {
			return null;
		}
		const minutes = Math.floor(this.seconds_until_expiry / 60);
		const seconds = this.seconds_until_expiry - minutes * 60;

		return `${minutes > 0 ? `${minutes}:` : ""}${
			seconds >= 10 ? seconds : `0${seconds}`
		}`;
	}

	@computed
	get cartSummary() {
		if (!this.items || this.items.length === 0) {
			return null;
		}

		//TODO get order fees and total costs from API, not manually adding up
		let orderTotalInCents = 0;
		let serviceFeesInCents = 0;
		let ticketItemList = [];
		let feeItemList = [];

		this.items.forEach(item => {
			const {
				id,
				item_type,
				quantity,
				ticket_pricing_id,
				ticket_type_id,
				unit_price_in_cents,
				description
			} = item;

			orderTotalInCents = orderTotalInCents + quantity * unit_price_in_cents;

			if (item_type === "PerUnitFees" || item_type === "EventFees") {
				serviceFeesInCents =
					serviceFeesInCents + unit_price_in_cents * quantity;

				feeItemList.push({
					id,
					quantity,
					pricePerTicketInCents: unit_price_in_cents,
					description
				});
			} else {
				ticketItemList.push({
					id,
					quantity,
					ticketTypeId: ticket_type_id, //The user will have to get the display name using this ID
					pricePerTicketInCents: unit_price_in_cents,
					description
				});
			}
		});

		return {
			orderTotalInCents,
			serviceFeesInCents,
			ticketItemList,
			feeItemList
		};
	}
}

const cart = new Cart();

export default cart;
