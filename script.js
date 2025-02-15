document.addEventListener("DOMContentLoaded", () => {
	//This example renders a scatterplot with DeckGL, on top of a basemap rendered with maplibre-gl, using a map style JSON from Carto.
	const { DeckGL, ScatterplotLayer, WebMercatorViewport, BitmapLayer } = deck;

	const initialViewState = {
		longitude: 137,
		latitude: 37,
		zoom: 4.5,
		width: window.innerWidth,
		height: window.innerHeight,
	};

	let viewState = {};

	const deckgl = new DeckGL({
		mapStyle:
			"https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json",
		initialViewState: initialViewState,
		controller: true,
		onViewStateChange: (newViewState) => {
			viewState = newViewState.viewState;
		},
	});

	const btnTemparature = document.querySelector("#temparature");
	btnTemparature.addEventListener("click", async () => {
		const currentViewport = new WebMercatorViewport(viewState);
		const currentBounds = currentViewport.getBounds();
		const bounds = currentBounds.join(",");
		const image = await getTemparature(bounds);

		console.log("bounds", bounds);

		const bitmapLayer = new BitmapLayer({
			id: "bitmaplayer",
			image: image,
			bounds: currentBounds,
			pickable: false,
		});

		deckgl.setProps({
			layers: [bitmapLayer],
		});
	});

	const btnSeaIce = document.querySelector("#sea-ice");
	btnSeaIce.addEventListener("click", async () => {
		const currentViewport = new WebMercatorViewport(viewState);
		const currentBounds = currentViewport.getBounds();
		const bounds = currentBounds.join(",");
		const image = await getSeaIce(bounds);

		console.log("bounds", bounds);

		const bitmapLayer = new BitmapLayer({
			id: "bitmaplayer",
			image: image,
			bounds: currentBounds,
			pickable: false,
		});

		deckgl.setProps({
			layers: [bitmapLayer],
		});
	});
});

/**
 * 海氷の画像データを取得
 * @param {string} bounds - "{north},{east},{south},{west}"
 * @returns - png img
 */
async function getSeaIce(bounds) {
	const key = "a029da17b446447bb74e6fff8e862d03";
	// 画像は上から被せる方式で表示するので背景透過をfetchする
	const url = `https://api.msil.go.jp/ice-information-jcg/v2/MapServer/export?bbox=${bounds}&transparent=true&dpi=96`;
	// const url = `https://api.msil.go.jp/ice-information-jcg/v2/MapServer/export?bbox=${bounds}&transparent=false&dpi=96`;
	const headers = {
		"Cache-Control": "no-cache",
		"Ocp-Apim-Subscription-Key": key,
	};

	const image = await fetch(url, {
		method: "GET",
		headers: headers,
	})
		.then(async (response) => {
			if (response.status === 200) {
				const blob = await response.blob();
				return blob;
			} else {
				console.warn(`api call failed: ${response.status}`);
				console.warn(response.text());
			}
		})
		.then((blob) => {
			const imageUrl = URL.createObjectURL(blob);
			const img = document.createElement("img");
			img.src = imageUrl;
			return imageUrl;
		})
		.catch((e) => {
			console.error(e);
		});

	return image;
}

/**
 * 水温の画像データを取得
 * @param {string} bounds - "{north},{east},{south},{west}"
 * @returns - 画像url
 */
async function getTemparature(bounds) {
	const key = "a029da17b446447bb74e6fff8e862d03";
	const url = `https://api.msil.go.jp/water-temperature-link/v2/MapServer/export?bbox=${bounds}&transparent=true&dpi=96`;
	const headers = {
		"Cache-Control": "no-cache",
		"Ocp-Apim-Subscription-Key": key,
	};

	const image = await fetch(url, {
		method: "GET",
		headers: headers,
	})
		.then(async (response) => {
			if (response.status === 200) {
				const blob = await response.blob();
				return blob;
			} else {
				console.warn(`api call failed: ${response.status}`);
				console.warn(response.text());
			}
		})
		.then((blob) => {
			const imageUrl = URL.createObjectURL(blob);
			const img = document.createElement("img");
			img.src = imageUrl;
			return imageUrl;
		})
		.catch((e) => {
			console.error(e);
		});

	return image;
}
