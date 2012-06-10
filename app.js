$(function(){

	//DEFINE THE APPLICATION
	var Owsthat = {};

	(function(app){
		// DEFINE VARIABLES
		var $selectTeam1 = $('#selectTeam1');
		var $selectTeam2 = $('#selectTeam2');
		var $btnStart = $("#btnStart");
        var battingDiceText = ['1','2','3','4','Owsthat','6'];
        var umpireDiceText = ['Bowled','Stumped','Caught','Not Out','No Ball','LBW'];
        var flagsDirectory = 'themes/images/flags/48/';
		var	blankRow = '<tr><td></td><td>&nbsp;&nbsp;</td><td><td></td></tr>';
        var runs = 0;
        var umpireDice = 0;
        var activeTeam = 1;
        var bowlingTeam = 0;
        var battingTeam = 0;
        var activeTeamName = '';
        var activeTeamShortName = '';
        var activeTeamScore = 0;
        var activeTeamExtras = 0;
        var activePlayer = 0;
        var activePlayerScore = 0;
        var activeBowler = 10;
        var bowlNumber = 0;
        var noOfOvers = 0;
		var aryTeamName = new Array();
		var aryTeamShortName = new Array();
		var aryTeamFlag = new Array();
		var aryPlayer = new Array();
		var aryCommentaryText = new Array();
		var aryQty = new Array();
		var extraCommentaryText = '';
		var gameOver = 0;
		var sel = '';

		//INITIALISE THE APP
		app.init = function(){
			//GET THE TEAM DATA FROM THE XML FILE
			app.getTeamData();
			//GET THE COMMENTARY DATA FROM THE XML FILE
			app.getCommentaryData();
			//APPLY BINDINGS
			app.bindings();
			//INITIALLY HIDE THE BUTTON UNTIL TWO TEAMS ARE SELECTED
			$btnStart.hide();
		}
		//GET THE TEAM DATA FROM THE XML FILE
		app.getTeamData = function(){
			$.ajax({
				type: "GET",
				url: "owsthat.xml",
				dataType: "xml",
				success: function(xml) {
					$(xml).find('team').each(function(){
						var teamid = $(this).attr('teamid');
						var teamname = $(this).attr('teamname');
						var teamshortname = $(this).attr('teamshortname');
						var teamflag = $(this).attr('teamflag');
						sel += '<option value="' + teamid + '">' + teamname + '</option>';
						aryTeamName[teamid] = teamname;
						aryTeamShortName[teamid] = teamshortname;
						aryTeamFlag[teamid] =  teamflag;
						aryPlayer[teamid] = new Array();
						$(this).find('player').each(function(){
							var playerID = $(this).attr('id');
							var playerInitials = $(this).find('initials').text();
							var playerName = $(this).find('name').text();
							aryPlayer[teamid][playerID] = playerInitials + ' ' + playerName;						
						});
					});
					$selectTeam1.append(sel);
					$selectTeam2.append(sel);
					$selectTeam1.selectmenu();
					$selectTeam2.selectmenu();
				}
			});
		}
		//GET THE COMMENTARY DATA FROM THE XML FILE
		app.getCommentaryData = function(){
			$.ajax({
				type: "GET",
				url: "commentary.xml",
				dataType: "xml",
				success: function(xml) {
					$(xml).find('type').each(function(){
						var typeid = $(this).attr('typeid');
						var typename = $(this).attr('typename');
						var qty = $(this).attr('qty');
						aryQty[typeid] = qty; 
						aryCommentaryText[typeid] = new Array();
						$(this).find('commentaryText').each(function(){
							var textID = $(this).attr('id');
							var txtValue = $(this).find('txtValue').text();
							aryCommentaryText[typeid][textID] = txtValue;						
						});
					});
				}
			});
		}
		//APPLY BINDINGS
		app.bindings = function(){
			//PROCESS THE TEAM SELECTION
			$("#selectTeam1,#selectTeam2").change(function(event){
				if($selectTeam1.val() && $selectTeam2.val()){
					//SHOW THE START BUTTON
					$btnStart.show();
					//SHOW TEAM SCORE
					var srcFile = flagsDirectory + aryTeamFlag[$selectTeam1.val()] + '.png';
					$("#headerFlagName_1").attr("src",flagsDirectory + aryTeamFlag[$selectTeam1.val()] + '.png');
					$("#headerTeamName_1").html(aryTeamShortName[$selectTeam1.val()]);
					$("#headerTeamScore_1").html(activeTeamScore);
					$("#headerTeamOut_1").html(activePlayer);
					$("#headerFlagName_2").attr("src",flagsDirectory + aryTeamFlag[$selectTeam2.val()] + '.png');
					$("#headerTeamName_2").html(aryTeamShortName[$selectTeam2.val()]);
					$("#headerTeamScore_2").html('0');
					$("#headerTeamOut_2").html('0');
				}
			});
			//PROCESS START BUTTON
			$("#btnStart").click(function(event){
				bowlingTeam = $selectTeam1.val();
				battingTeam = $selectTeam2.val();
			});
			//BATTING BUTTON
		    $("#btnBat").click(function(event){
		        //ROLL THE DICE
		        var battingDice = rollDice();
		        //INCREMENT THE BOWLING FIGURE
		        bowlingStats();
		        if(battingDice == 5){
		    	    //OWSTHAT
		            umpireDice = rollDice();
		            //NOT OUT
		            if(umpireDice == 4 || umpireDice == 5){
		            	//NO BALL
		                if(umpireDice == 5){
		                	activeTeamExtras++;
		                	//ADD RUNS TO PLAYERS SCORE
		                	activePlayerScore++;
		                	//ADD RUNS TO TEAM SCORE
		                	activeTeamScore++;
		                }
			            //GET EXTRA COMMENTARY
			            extraCommentaryText = getExtraCommentary('notout',umpireDice); 
		                //DISPLAY SCORES
		                displayScores(battingDice,umpireDice); 
		            }
		            else{
			            //GET EXTRA COMMENTARY
			            extraCommentaryText = getExtraCommentary('out',umpireDice); 
		                //DISPLAY SCORES
		                displayScores(battingDice,umpireDice);  
		            	//GET NEXT ACTIVE PLAYER
		                activePlayer++;
		                //LAST PLAYER HAS BATTED
		                if(activePlayer == 2){
		                	if(activeTeam == 1){
		                    	activeTeam++;
		                    	activeTeamScore = 0;
		                    	activeTeamExtras = 0;
		                    	activePlayer = 0;
		                    	activePlayerScore = 0;
		        	        	bowlNumber = 0;
					        	noOfOvers = 1;
					        	$("#headerTeamOut_1").html('All Out');
		                  	}
		                  	else{
					        	$("#headerTeamOut_2").html('All Out');
		                  		$("#btnBat").hide();
		                  		var txtWinner = '';
		                  		var diff = '';
		                  		var txtWinningTeam = '';
		                  		var t1Score = parseInt($("#headerTeamScore_1").text());
		                  		var t2Score = parseInt($("#headerTeamScore_2").text());
	                  			diff = (Math.abs(t1Score - t2Score)).toString();
		                  		if(t1Score > t2Score){
		                  			txtWinningTeam = aryTeamName[$selectTeam1.val()];
		                  		}
		                  		else
		                  		{
		                  			txtWinningTeam = aryTeamName[$selectTeam2.val()];
		                  		}
	                  			txtWinner += '<table align="center"><tr><td><strong>' + txtWinningTeam + ' won by ' + diff + ' Runs' + '</strong></td></tr></table>';
								txtWinner += '<table>';
								txtWinner += $('#txtCommentary').html();
								txtWinner += '</table>';
								$('#txtCommentary').html(txtWinner);
		                	}
		                }
		                //RESET ACTIVE PLAYER SCORE
		                activePlayerScore = 0;
		            }
		        }
		        else{
		            //ADD RUNS TO PLAYERS SCORE
		            activePlayerScore = activePlayerScore + battingDice;
		            //ADD RUNS TO TEAM SCORE
		            activeTeamScore = activeTeamScore + battingDice;
		            //GET EXTRA COMMENTARY
		            extraCommentaryText = getExtraCommentary('scored',battingDice); 
		            //DISPLAY SCORES
		            displayScores(battingDice,0); 
		        }
		    });
		}
		//DISPLAY SCORES
		function displayScores(batValue,umpValue){
			var commentaryText = ''; 
			commentaryText += '<tr>'; 
			commentaryText += '<td>'; 
			commentaryText += noOfOvers + '.' + bowlNumber +' '; 
			commentaryText += '</td>'; 
			commentaryText += '<td>&nbsp;&nbsp;</td>'; 
			commentaryText += '<td>'; 
			commentaryText += aryPlayer[bowlingTeam][activeBowler]; 
			commentaryText += ' to '; 
			commentaryText += aryPlayer[battingTeam][activePlayer]; 
			commentaryText += '. '; 
			commentaryText += '</td>'; 
			commentaryText += '</tr>'; 
			commentaryText += '<tr>'; 
			commentaryText += '<td>'; 
			commentaryText += '</td>'; 
			commentaryText += '<td>&nbsp;&nbsp;</td>'; 
			commentaryText += '<td>'; 
			commentaryText += extraCommentaryText; 
			commentaryText += '</td>'; 
			commentaryText += '</tr>'; 
			commentaryText += $('#txtCommentary').html();
			$('#headerTeamScore_' + activeTeam).html(activeTeamScore); 
			$('#headerTeamOut_' + activeTeam).html(activePlayer);
			$('#txtCommentary').html(commentaryText);
			$('#oversPlayed_' + activeTeam).html(noOfOvers + '.' + bowlNumber);
		}
		//GET EXTRA COMMENTARY
		function getExtraCommentary(playType,diceValue){
			var extraText = '';
			var randomNo = 0;
			switch(playType){
				case 'notout':
					randomNo = getRandomNumber(aryQty[0]);
					if(diceValue == 4){
						//NO RUN
						extraText = '<strong>NO RUN. </strong>' + aryCommentaryText[0][randomNo];
					}
					if(diceValue == 5){
						//NO RUN
						extraText = '<strong>NO BALL. </strong>' + aryCommentaryText[0][randomNo];
					}
					break;
				case 'out':
					randomNo = getRandomNumber(aryQty[4]);
					extraText = '<strong>OUT. </strong>' + aryCommentaryText[4][randomNo];
					break;
				case 'scored':
					switch(diceValue){
						case 1:
							randomNo = getRandomNumber(aryQty[1]);
							extraText = '<strong>1 RUN. </strong>' + aryCommentaryText[1][randomNo];
							break;

						case 2:
							randomNo = getRandomNumber(aryQty[1]);
							extraText = '<strong>2 RUNS. </strong>' + aryCommentaryText[1][randomNo];
							break;
						case 3:
							randomNo = getRandomNumber(aryQty[1]);
							extraText = '<strong>3 RUNS. </strong>' + aryCommentaryText[1][randomNo];
							break;
						case 4:
							randomNo = getRandomNumber(aryQty[2]);
							extraText = '<strong>FOUR. </strong>' + aryCommentaryText[2][randomNo];
							break;
						case 6:
							randomNo = getRandomNumber(aryQty[3]);
							extraText = '<strong>SIX. </strong>' + aryCommentaryText[3][randomNo];
							break;
					}
					break;
			}
			return extraText;
		}
		//ROLL DICE
		function rollDice(){
			dice = (Math.floor(Math.random()*5)+1);
			return dice;
		}
		//GET RANDOM NUNBER
		function getRandomNumber(max){
			max = max - 1;
			number = (Math.floor(Math.random()*max)+1);
			return number;
		}
		//BOWLING STATS
		function bowlingStats(){
       	    bowlNumber =bowlNumber + 1;
	        if(bowlNumber == 7){
	        	bowlNumber = 1;
	        	noOfOvers++;
	        	chooseBowler();
	        }
		}
		//CHOOSE BOWLER
		function chooseBowler(){
	        //ROLL THE DICE
	        var bowlerDice = rollDice();
			var commentaryText = '';
			switch(bowlerDice){
				case 1: case 2:
					activeBowler = 8;
					break;
				case 3: case 4:
					activeBowler = 9;
					break;
				case 5: case 6:
					activeBowler = 10;
					break;
			}
			commentaryText += blankRow;
			commentaryText += '<tr>'; 
			commentaryText += '<td>'; 
			commentaryText += '</td>'; 
			commentaryText += '<td>&nbsp;&nbsp;</td>'; 
			commentaryText += '<td>'; 
			commentaryText += '<strong>End of Over ' + noOfOvers + '. ' + aryPlayer[bowlingTeam][activeBowler] + ' to bowl the next over.<strong>'; 
			commentaryText += '</td>'; 
			commentaryText += '</tr>';
			commentaryText += blankRow;
			commentaryText += $('#txtCommentary').html();
			$('#txtCommentary').html(commentaryText);
		}
		//LAUNCH APPLICATION
		app.init();
	})(Owsthat);
});