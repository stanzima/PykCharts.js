PykCharts.oneD.bubble = function (options) {
    var that = this;

    this.execute = function () {
        that = PykCharts.oneD.processInputs(that, options);

        if(that.mode === "default") {
           that.k.loading();
        }
        d3.json(options.data, function (e,data) {
            that.data = data.groupBy("oned");
            $(options.selector+" #chart-loader").remove();
            that.clubData_enable = that.data.length>that.clubData_maximumNodes ? that.clubData_enable : "no";
            that.render();

        });
    };

    this.refresh = function () {

        d3.json (options.data, function (e,data) {
            that.data = data.groupBy("oned");
            that.new_data = that.optionalFeatures().clubData();
            that.optionalFeatures()
                .createChart()
                .label();
            that.k.lastUpdatedAt("liveData");
        });
    };

    this.render = function () {
        that.fillChart = new PykCharts.oneD.fillChart(that);
        that.onHoverEffect = new PykCharts.oneD.mouseEvent(that);
        that.transitions = new PykCharts.Configuration.transition(that);
        if (that.mode ==="default") {
            that.k.title();
            that.k.subtitle();
            that.new_data = that.optionalFeatures().clubData();
            that.optionalFeatures().svgContainer()
                .createChart()
                .label();

            that.k.createFooter()
                .lastUpdatedAt()
                .credits()
                .dataSource()
                .liveData(that)
                .tooltip();

        that.mouseEvent = new PykCharts.Configuration.mouseEvent(that);
       }
       else if (that.mode ==="infographics") {
            that.new_data = {"children" : that.data};
            that.optionalFeatures().svgContainer()
                .createChart()
                .label();

            that.k.tooltip();
            that.mouseEvent = new PykCharts.Configuration.mouseEvent(that);
       }
    };

    this.optionalFeatures = function () {

        var optional = {
            svgContainer: function () {
                $(that.selector).css("background-color",that.bg);

                that.svgContainer = d3.select(that.selector).append("svg")
                    .attr("class","svgcontainer")
                    .attr("id","svgcontainer")
                    .attr("width",that.width)
                    .attr("height",that.height);

                that.group = that.svgContainer.append("g")
                    .attr("id","bubgrp");
                return this;
            },
            createChart : function () {

                that.bubble = d3.layout.pack()
                    .sort(function (a,b) { return b.weight - a.weight; })
                    .size([that.width, that.height])
                    .value(function (d) { return d.weight; })
                    .padding(20);
                that.sum = d3.sum(that.new_data.children, function (d) {
                    return d.weight;
                })
                var l = that.new_data.children.length;
                // that.max = that.new_data.children[l-1].weight;
                that.node = that.bubble.nodes(that.new_data);

                that.chart_data = that.group.selectAll(".bubble-node")
                    .data(that.node);

                that.chart_data.enter()
                    .append("g")
                    .attr("class","bubble-node")
                    .append("circle");

                that.chart_data.attr("class","bubble-node")
                    .select("circle")
                    .attr("class","bubble")
                    .attr("x",function (d) { return d.x; })
                    .attr("y",function (d) { return d.y; })
                    .attr("r",0)
                    .attr("transform",function (d) { return "translate(" + d.x + "," + d.y +")"; })
                    .attr("fill",function (d) {
                        return d.children ? that.bg : that.fillChart.chartColor(d);
                    })
                    .on("mouseover", function (d) {
                        if(!d.children) {
                            that.onHoverEffect.highlight(options.selector+" "+".bubble", this);
                            d.tooltip = d.tooltip ||"<table class='PykCharts'><tr><th colspan='2' class='tooltip-heading'>"+d.name+"</tr><tr><td class='tooltip-left-content'>"+that.k.appendUnits(d.weight)+"  <td class='tooltip-right-content'>(&nbsp;"+((d.weight*100)/that.sum).toFixed(2)+"%&nbsp;)</tr></table>";
                            that.mouseEvent.tooltipPosition(d);
                            that.mouseEvent.toolTextShow(d.tooltip);
                        }
                    })
                    .on("mouseout", function (d) {
                        that.mouseEvent.tooltipHide(d)
                        that.onHoverEffect.highlightHide(options.selector+" "+".bubble");
                    })
                    .on("mousemove", function (d) {
                        if(!d.children) {
                            that.mouseEvent.tooltipPosition(d);
                        }
                    })
                    .transition()
                    .duration(that.transitions.duration())
                    .attr("r",function (d) {return d.r; });
                that.chart_data.exit().remove();

                return this;
            },
            label : function () {

                    that.chart_text = that.group.selectAll("text")
                        .data(that.node);

                    that.chart_text.enter()
                    .append("text")
                    .style("pointer-events","none");

                    that.chart_text.attr("text-anchor","middle")
                        .attr("transform",function (d) {return "translate(" + d.x + "," + (d.y + 5) +")";})
                        .text("")
                        // .transition()
                        // .delay(that.transitions.duration());

                    setTimeout(function() {
                        that.chart_text
                            .text(function (d) { return d.children ? " " :  d.name; })
                            .attr("pointer-events","none")
                            .text(function (d) {
                                if(this.getBBox().width< 2*d.r && this.getBBox().height<2*d.r) {
                                    return d.children ? " " :  d.name;
                                }
                                else {
                                     return "";
                                    }
                            })
                            .style("font-weight", that.label_weight)
                            .style("font-size",function (d,i) {
                                if (d.r > 24) {
                                    return that.label_size;
                                } else {
                                    return "10px";
                                }
                            })
                            .attr("fill", that.label_color)
                            .style("font-family", that.label_family);
                    },that.transitions.duration());
                        
                    that.chart_text.exit().remove;
                return this;
            },
            clubData : function () {
                var new_data1;
                if (PykCharts.boolean(that.clubData_enable)) {
                    var clubdata_content = [];
                    var k = 0, j, i, new_data = [];
                    if(that.data.length <= that.clubData_maximumNodes) {
                        new_data1 = { "children" : that.data };
                        return new_data1;
                    }
                    if (that.clubData_alwaysIncludeDataPoints.length!== 0) {
                        var l = that.clubData_alwaysIncludeDataPoints.length;
                        for (i =0; i<l; i++) {
                            clubdata_content[i] = that.clubData_alwaysIncludeDataPoints[i];
                        }
                    }
                    for (i=0; i<clubdata_content.length; i++) {
                        for (j=0; j< that.data.length; j++) {
                            if (clubdata_content[i].toUpperCase() === that.data[j].name.toUpperCase()) {
                                new_data.push(that.data[i]);
                            }
                        }
                    }
                    that.data.sort (function (a,b) { return b.weight - a.weight;});
                    while (new_data.length < that.clubData_maximumNodes-1) {
                        for(i=0;i<clubdata_content.length;i++) {
                            if(that.data[k].name.toUpperCase() === clubdata_content[i].toUpperCase()) {
                                k++;
                            }
                        }
                        new_data.push(that.data[k]);
                        k++;
                    }
                    var sum_others = 0;
                    for(j=k; j<that.data.length; j++) {
                        for (i=0; i<new_data.length && i< that.data.length; i++) {
                            if(that.data[j].name.toUpperCase() === new_data[i].name.toUpperCase()) {
                                sum_others+=0;
                                j++;
                                i = -1;
                            }
                        }
                        if(j<that.data.length) {
                            sum_others += that.data[j].weight;
                        }
                    }
                    var f = function (a,b) {return b.weight- a.weight;};
                    while (new_data.length > that.clubData_maximumNodes) {
                        new_data.sort(f);
                        var a = new_data.pop();
                    }

                    var others_Slice = {"name": that.clubData_text,"weight": sum_others, "color": that.clubData_color,"tooltip": that.clubData_tooltipText,"highlight":false};

                    if (new_data.length < that.clubData_maximumNodes) {
                        new_data.push(others_Slice);

                    }
                    new_data.sort(function (a,b) {
                        return a.weight - b.weight;
                    })

                    new_data1 = {"children": new_data};
                    that.map1 = new_data1.children.map(function (d) { return d.weight;});
                }
                else {
                    that.data.sort(function (a,b) {
                        return a.weight - b.weight;
                    })
                    new_data1 = { "children" : that.data };
                }
                return new_data1;
            }
        };
        return optional;
    };
};
