function updatemap() {

    fetch("https://corona-api.com/countries")
        .then(response => response.json())
        .then(rsp => {

            console.log(rsp.data)
            rsp.data.forEach(element => {

                latitude = element.coordinates.latitude;
                longitude = element.coordinates.longitude;
                //mark on the map
                name = element.name;
                population = element.population;
                todaydead = element.today.deaths;
                todayconf = element.today.confirmed;
                totDead = element.latest_data.deaths;
                infected = element.latest_data.confirmed;
                totRec = element.latest_data.recovered;
                critical = element.latest_data.critical;
                death_rate = element.latest_data.calculated.death_rate;
                recovery_rate = element.latest_data.calculated.recovery_rate;



                var popup = new mapboxgl.Popup({

                    offset: 25,
                    html : true,
                    title: "<span class='booked'>This is booked</span>"

                }).setText(
                    `<h2>${name}</h2>
                    <ul>
                        <li>Total Popualtion : ${population}</li> 
                        <li>Total death today : ${todaydead}</li>
                        <li>Total conf today : ${todayconf}</li>
                        <li>Total death up till now : ${totDead}</li>
                        <li>Total infected up till now : ${infected}</li>
                        <li>Total Recovery up till now : ${totRec}</li>
                        <li>Critical cases : ${critical}</li>
                        <li>Approx. Death Rate : ${death_rate}</li>
                        <li>Approx Recovery Rate : ${recovery_rate}</li>
                    </ul>

                    `
                )

                var marker = new mapboxgl.Marker({
                    draggable: false,
                    color: "rgb(" + infected / 10000 + ",0,0)"
                }).setLngLat([longitude, latitude])
                    .setPopup(popup)
                    .addTo(map);




                // console.log(latitude + ", " + longitude);

            });


        })




}

updatemap();