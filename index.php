<html>

	<head onresize="onPageResize()">


	<style>
		@import url('https://fonts.googleapis.com/css2?family=Yusei+Magic&display=swap');
	</style>

	<link rel="stylesheet" href="style.css">


	<div class="titleDiv">
		<h1> Youtube Music Analyser </h1><br>
		<h2>Uncover your music past</h2>
	</div>

	<div class="splitContainer">
		<div class="buttonType">
			<div class="fileUpload">
				<h2> I have my file! </h2>
				<input type="file" accept=".json" class="upload" id="file-input" />
			</div>
		</div>
		<div class="buttonType" onclick="showInstructions()">
			<div id="circle"></div>
			<a href="#"></a>
			<h2> I don't have my file! </h2>
                </div>
	</div>

	<div class="instructionsContainer" id="instructions">
		<div class="instructionsChild" style="border: none">
			<div class="splitChild" id="leftInst" style="">
				<h2> On Android </h2>
				<p style="text-align: center; font-size: 24"> Settings <br> &darr; <br> Google <br> &darr; <br> Manage your google account <br> &darr; <br> Data & personalization <br> &darr; <br> Download your data </p>
			</div>
			<div class="splitChild" style="">
				<h2 style="width: 100%"> Other </h2>
				<p style="width: 100%; font-size: 24"> Go to <a href="https://takeout.google.com/">https://takeout.google.com/</a>
			</div>
		</div>
			<div class="buttonType" style="margin: 20px" onclick="showInstructionsPtTwo()">
				<h2> Next </h2>
			</div>

			<div id="instructionsPt2" style="display: none; flex-wrap: wrap; justify-content: center">
				<p class="instructionsText"> We only need one item so first deselect all </p>
				<img style="width: 50%; display: inherit" src="images/step1.png">
				<p class="instructionsText"> The data we need is inside &quot;My Activity&quot; not youtube </p>
				<img style="width: 50%; display: inherit" src="images/step2.png">
				<p class="instructionsText">Inside &quot;Multiple formats&quot; select JSON instead of HTML</p>
				<img style="width: 50%; display: inherit" src="images/step4.png">
				<p class="instructionsText"> Under &quot;All activity data included&quot; deselect all and scroll down to the bottom where you must select youtube </p>
				<img style="width: 50%; display: inherit" src="images/step7.png">
				<p class="instructionsText"> Now just export your data and google should send you an email with a link in a few minutes. Once you've downloaded the data, extract it and upload the JSON file within. The path should be Takeout/My Activity/YouTube/My Activity.json</p>

				<div class="buttonType" style="display: inherit">
					<div class="fileUpload" style="display: inherit">
		                              	<h2> I have my file! </h2>
                	                	<input type="file" accept=".json" class="upload" id="file-input" style="display: inherit" />
                        		</div>
				</div>
			</div>
	</div>
	</div>

<!--
	<div class="fileUpload">
		<input type="file" class="upload" id="file-input" />
		<a style="color: white"> Upload </a>
	</div>
-->

<!--
	<h3>Years</h3>
	<pre id="yearResults"></pre>

	<h3>Artists</h3>
        <pre id="artistsResults"></pre>

	<h3>Songs</h3>
        <pre id="songsResults"></pre>

	<h3>Searches</h3>
        <pre id="searchesResults"></pre>
-->
	</head>



	<script src="https://cdn.jsdelivr.net/npm/chart.js@2.8.0"></script>
	<script src="/ytm/script.js"></script>




	<!-- Slideshow container -->
	<div class="slideshow-container" id="slideshowGraphs">

	<!-- Full-width images with number and caption text -->
	<div class="mySlides fade">
		<canvas id="yearsChart" style="width:75%"></canvas>
	</div>

	<div class="mySlides fade">
		<canvas id="artistsChart"></canvas>
	</div>

	<div class="mySlides fade">
		<canvas id="songsChart"></canvas>
	</div>

	<div class="mySlides fade">
		<canvas id="searchesChart"></canvas>
        </div>


		<!-- Next and previous buttons -->
		<a class="prev" onclick="plusSlides(-1)">&#10094;</a>
		<a class="next" onclick="plusSlides(1)">&#10095;</a>
	<br>

	<!-- The dots/circles -->
	<div style="text-align:center">
		<span class="dot" onclick="currentSlide(1)"></span>
		<span class="dot" onclick="currentSlide(2)"></span>
		<span class="dot" onclick="currentSlide(3)"></span>
		<span class="dot" onclick="currentSlide(4)"></span>
	</div>
	</div>


</html>
