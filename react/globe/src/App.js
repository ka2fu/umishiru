import "./App.css";

// import DeckGL from "@deck.gl/react";
import Map from "react-map-gl/maplibre"; // "react-map-gl"だとimportに失敗する
import React, { useEffect, useState, useRef } from "react";
import DeckGL, {
	MapController,
	//globviewを読み込む(まだexperimentalなのでアンダーバーがついています)
	_GlobeView as GlobeView,
	COORDINATE_SYSTEM, //ビルトインされている座標系を読み込み
	TileLayer,
	GeoJsonLayer,
	BitmapLayer,
} from "deck.gl";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { render } from "@testing-library/react";
import { arcgisToGeoJSON } from "@terraformer/arcgis";

// function renderLayers(arg) {
// 	const point = new ScatterplotLayer({
// 		data: arg.data,
// 		pickable: false,
// 		stroked: true,
// 		filled: true,
// 		radiusScale: 6,
// 		radiusMinPixels: 1,
// 		radiusMaxPixels: 100,
// 		lineWidthMinPixels: 1,
// 		getPosition: (d) => {
// 			return [d.lng, d.lat];
// 		},
// 		getRadius: 10,
// 		getFillColor: (d) => [255, 140, 0],
// 		getLineColor: (d) => [0, 0, 0],
// 	});

// 	return [point];
// }

export function renderLayers(props) {
	//県境界データを可視化
	const geoJSONlayer = new GeoJsonLayer({
		id: "geojson-layer",
		data: "./data/countries-mini.geojson",
		pickable: true,
		stroked: true,
		filled: true,
		wireframe: true,
		lineWidthMinPixels: 5,
		extruded: true,
		getElevation: 10000, //高さを設定しないとタイルの裏に回ってしまう。
		getFillColor: [0, 160, 0, 180],
		getLineColor: [0, 0, 0, 255],
	});

	//OSMタイルを読み込みベースマップとして表示
	const tileLayer = new TileLayer({
		data: "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
		// minZoom: 0,
		// maxZoom: 19,
		tileSize: 256,

		renderSubLayers: (props) => {
			const {
				bbox: { west, south, east, north },
			} = props.tile;

			return new BitmapLayer(props, {
				data: null,
				image: props.data,
				//画像(タイル)を直交座標系で配置する
				_imageCoordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
				bounds: [west, south, east, north],
			});
		},
	});

	return [tileLayer, geoJSONlayer];
}

export function renderIceLayer(data) {
	console.log("data", data);
	const features = data["features"];

	const jsons = [];
	features.forEach((element) => {
		const geojson = arcgisToGeoJSON(element);
		jsons.push(geojson);
	});

	const polygon = {
		type: "FeatureCollection",
		name: "ice-layer",
		features: jsons,
	};
	console.log("polygon", polygon);

	const iceLayer = new GeoJsonLayer({
		id: "ice-layer",
		data: polygon,
		filled: true,
		stroked: true,
		getLineWidth: 40,
		getLineColor: [255, 0, 0],
		getFillColor: [255, 0, 0, 100],
	});

	return iceLayer;
}

function App() {
	// 初期ビューポートの設定
	// const INITIAL_VIEW_STATE = {
	// 	latitude: 35.688584,
	// 	longitude: 139.7454316,
	// 	bearing: 0,
	// 	pitch: 0,
	// 	zoom: 12,
	// };
	// const data = [
	// 	{ name: "東京タワー", lng: 139.7454316, lat: 35.658584 },
	// 	{ name: "東京スカイツリー", lng: 139.8108103, lat: 35.7100069 },
	// ];

	// return (
	// 	<div className="App">
	// 		<DeckGL
	// 			initialViewState={INITIAL_VIEW_STATE}
	// 			controller={true}
	// 			layers={renderLayers({ data: data })}
	// 		>
	// 			<Map
	// 				mapLib={maplibregl}
	// 				mapStyle="https://tile.openstreetmap.jp/styles/osm-bright-ja/style.json"
	// 			/>
	// 		</DeckGL>
	// 	</div>
	// );

	const [layers, setLayers] = useState(renderLayers());
	const [viewState, setViewState] = useState({
		width: window.innerWidth,
		height: window.innerHeight,
		longitude: 135.0066832,
		latitude: 37.9619195,
		zoom: 0,
		maxZoom: 16,
	});
	const isMounted = useRef(false);

	useEffect(() => {
		if (!isMounted.current) {
			const key = "a029da17b446447bb74e6fff8e862d03";
			const url = `https://api.msil.go.jp/oceanography/ice-information-jcg/v1/query?bbox=120.02357048717668,25.78629473863785,162.86889624730708,55.612385933661386&units=meter&returnGeometry=true&type=ice`;
			const headers = {
				"Cache-Control": "no-cache",
				"Ocp-Apim-Subscription-Key": key,
			};
			fetch(url, { method: "GET", headers: headers })
				.then(async (res) => {
					if (res.status === 200) {
						return await res.json();
					} else {
						console.log("failed to fetch", res.status);
						console.error(res.text());
					}
				})
				.then((data) => {
					let tmp = layers;
					tmp.push(renderIceLayer(data));
					setLayers(tmp);
					console.log("layers", layers);
				})
				.catch((e) => console.error(e));
		}
	}, []);

	return (
		<DeckGL
			views={new GlobeView()}
			layers={layers}
			controller={{ type: MapController }}
			initialViewState={viewState}
		></DeckGL>
	);
}

export default App;
