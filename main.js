"use strict";

$(function () {

    mainFunction();

});

async function mainFunction() {

    try {

        //show 100 coins to page home
        let allCoins = await getData("https://api.coingecko.com/api/v3/coins/list");
        const content = allCoins.slice(0,100).map((currentValue , index) =>`
        <div class="card col-md-4 col-lg-3">
        <div class="card-body">
            <div class="row">
                <div class="none">${currentValue.symbol.toUpperCase()}</div>
                <h5 class="card-title col-9">${currentValue.symbol.toUpperCase()}</h5>
                <div class="col-3">
                    <label class="switch checkbox">
                    <input class="checkbox" type="checkbox" id="${"checkbox" + currentValue.symbol.toUpperCase()}">
                    <span class="slider round"></span>
                    </label>
                </div>
                <p class="card-text col-12">${currentValue.name}</p>
                <p>
                <button class="btn btn-primary" type="button" data-toggle="collapse" data-target="#${"Collapse" + index}" aria-expanded="false" aria-controls="collapseExample">
                <span class="spinner-border-sm" role="status" aria-hidden="true"></span>
                <div class="none">${currentValue.id}</div>
                More Info
                </button>
                </p>
                <div class="collapse col-12" id="${"Collapse" + index}">
                    <div class="card card-body"></div>
                </div>
            </div>
        </div>
        </div>` );
        $(".loader").hide();
        $("#home").append(content)
        
        //get more info 
        $("p > button").click(async function () {

            if (!($(this).parent().siblings(".collapse").hasClass("show"))){
                const id =  $(this).children(".none").text();
                $(this).children().addClass("spinner-border");
                const sessionKey = "key" + id;
                if(sessionStorage.getItem(sessionKey)){
                    const sessionList = sessionStorage.getItem(sessionKey).split("&");
                    disblayMoreInfo(sessionList[0],sessionList[1],sessionList[2],sessionList[3],sessionList[4]);
                    
                }else{
                    let moreInfo = await getData("https://api.coingecko.com/api/v3/coins/" + id)
                    const collapseID =  $(this).parent().siblings(".collapse").attr('id');
                    let image = "";
                    if($(window).width() > 900){
                        image = moreInfo.image.large;
                    }else if($(window).width() > 576){
                        image = moreInfo.image.small;
                    }else{
                        image = moreInfo.image.thumb;
                    }
                    const usd = moreInfo.market_data.current_price.usd;
                    const eur = moreInfo.market_data.current_price.eur;
                    const ils = moreInfo.market_data.current_price.ils;
                    disblayMoreInfo(collapseID,image,usd,eur,ils);
                    
                    //save to  Session Storage
                    sessionStorage.setItem(sessionKey ,collapseID + "&" + image + "&" + usd + "&" + eur + "&" + ils);
                        setTimeout(() => {
                            sessionStorage.removeItem(sessionKey);
                        }, 120000);
                }
                $(this).children().removeClass("spinner-border");
            }                
        });

        //search 
        $("#searchButton").click(() => {
            const value = $("#search").val().toUpperCase();
            $('.card-title').each(function () {
                const index = $(this).html().search(value);
                if(index < 0){
                    $(this).parent().parent().parent().hide();
                }else{
                    $(this).html(
                        $(this).html().substring(0,index) + 
                        "<span class='highlight'>" + 
                        $(this).html().substring(index,index+value.length) 
                        + "</span>" + $(this).html().substring(index + value.length));
                }
            });
        })

        //clear search 
        $("#search").keyup(() => {

            if($("#search").val() === ""){
                $(".loader").show();
                setTimeout(() => {      
                    $('.card-title').each(function () {
                        $(this).parent().parent().parent().show();
                        $(this).children().removeClass("highlight");
                    });
                    $(".loader").hide(100);
                }, 0.0);
            }
        })
        
        //click on over 5 checkbox slider show Modal
        $(".card input:checkbox").click(function () {

            if($(".card input:checked").length > 5){
                $(this).prop( "checked", false );
                $(".modal-body").empty();
                $(".modal-body").html( `<div class="container-fluid">
                <div>Only 5 checkboxes can be displayed in real-time reports</div><br><br></div>`);

                $(".card input:checked").each(function (index){
                    const symbol = $(this).parent().parent().siblings('.none').html();
                    const html = `
                    <div class="row justify-content-md-center">
                    <div class="col-md-2"><h5 id="modalCheckboxTitl${index}">${symbol}</h5></div>
                    <div class="col-md-2">
                    <label class="switch">
                        <input type="checkbox" checked>
                        <span class="slider round"></span>
                    </label></div>
                    </div><br>
                    `
                    $(".modal-body").append(html);
                    
                });
                $('#modal').modal('show');

                $("#saveChanges").click(()=>{
            
                    $(".modal-body input:checkbox").each(function (){
                        const symbol = $(this).parent().parent().prev().children().html();
                        const findId = "#checkbox" + symbol;
                        if (!($(this).is(':checked'))) {
                            $(findId).prop( "checked", false );
                        }
                    });
                    $('#modal').modal('hide');
                    $(this).prop( "checked", true );
                });
            };
        });

        //click on reports menu
        $("#toReports").click(()=>{

            $("#chartContainer").hide();
            $("#home").hide();
            $(".loader").show();
            $("#toReports").addClass("active");
            $("#toHome").removeClass("active");
            $(".form-inline").hide();
            $("#toAbout").removeClass("active");
            $("#about").hide();

            let options = {
                exportEnabled: true,
                animationEnabled: true,
                title:{
                    text: "Units Sold VS Profit"
                },
                subtitles: [{
                    text: "The graph is updated every two seconds"
                }],
                axisX: {
                    title: "Date And Time",
                    gridThickness: 1,
                    gridColor: "lightblue",
                },
                axisY: {
                    title: "Value in dollars",
                    titleFontColor: "#4F81BC",
                    lineColor: "#4F81BC",
                    labelFontColor: "#4F81BC",
                    tickColor: "#4F81BC",
                    prefix: "$",
                    includeZero: true
                },
                toolTip: {
                    shared: true
                },
                legend: {
                    cursor: "pointer",
                    itemclick: toggleDataSeries
                },
                data: [
            ]
            };

            let urlAjax = "https://min-api.cryptocompare.com/data/pricemulti?fsyms="
            let titl = "";
            if($(".card input:checked").length === 0){
                titl =  "There are no coins to display";
            }else{
                titl = "";
            }

            $(".card input:checked").each(function (index){
                const symbol = $(this).parent().parent().siblings('.none').html();
                const obj = {
                    type: "spline",
                    name: symbol,
                    showInLegend: true,
                    xValueFormatString: "hh:mm",
                    yValueFormatString: "$#,##0.####",
                    dataPoints: []
                }
                options.data.push(obj);
                const length =  $(".card input:checked").length;
                if(!(index === length - 1)){
                    urlAjax += symbol + ",";
                    titl += symbol + "," + " ";
                }else{
                    urlAjax += symbol;
                    titl += symbol + " TO USD $"
                };
            });

            options.title.text = titl;

            //get data Points every two seconds
            var interval = setInterval(async function (){
  
                const coinJson = await getData(urlAjax + "&tsyms=USD");
                for(let coin in coinJson) {
                    const obj = {x: new Date() , y: coinJson[coin].USD}
                    for(let item of options.data){
                        if(item.name  ===  coin){
                            item.dataPoints.push(obj);
                        }
                    }
                }
                $("#chartContainer").CanvasJSChart().render();

            }, 2000);
            
        
            function toggleDataSeries(e) {
                if (typeof (e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
                    e.dataSeries.visible = false;
                } else {
                    e.dataSeries.visible = true;
                }
                e.chart.render();
            }

            $(".loader").hide(2000);
            $("#chartContainer").show(2000);
            $("#chartContainer").CanvasJSChart(options);

            //clear interval
            $("#toHome").click(() => {
                clearInterval(interval);
            });

            $("#toReports").click(() => {
                clearInterval(interval);
            });
        });

        //click on home menu
        $("#toHome").click(() => {

            $("#toHome").addClass("active");
            $("#home").show();
            $("#chartContainer").hide();
            $("#about").hide();
            $("#toReports").removeClass("active");
            $("#toAbout").removeClass("active");
            $(".form-inline").show();

            
        });

        //click on about menu
        $("#toAbout").click(()=>{

            $("#toAbout").addClass("active");
            $("#about").show();
            $("#home").hide();
            $("#chartContainer").hide();
            $("#toReports").removeClass("active");
            $("#toHome").removeClass("active");
            $(".form-inline").hide();

        });

    }
    catch (error) {
        alert("something went wrong please try again .. " + "\nEroor Status: " + error.status);
    }
}

function getData(url) {
    return new Promise((resolve, reject) => {
        $.getJSON(url, json => {
            resolve(json);
        }).fail(err => {
            reject(err);
        });
    });
}


function disblayMoreInfo(id, image, usd, eur, ils){
    $("#" + id).children().html(`
    <img src="${image}" alt="..." class="img-thumbnail"></img>
    <br>
    <table class="table">
    <thead>
    </thead>
    <tbody>
    <tr>
        <th scope="row">$</th>
        <td>${usd}</td>
    </tr>
    <tr>
        <th scope="row">€</th>
        <td>${eur}</td>
    </tr>
    <tr>
        <th scope="row">₪</th>
        <td>${ils}</td>
    </tr>
    </tbody>
    </table>
    `) 
}





