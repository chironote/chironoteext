$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Drawing

$repositoryPath = Split-Path -Parent $PSScriptRoot
$outputPath = Join-Path $repositoryPath 'release-artifacts\store'
$visualPath = Join-Path $repositoryPath 'release-artifacts\visual'
$logoPath = Join-Path $repositoryPath 'public\logo512.png'
New-Item -ItemType Directory -Path $outputPath -Force | Out-Null

function New-Canvas([int]$width, [int]$height) {
  $bitmap = New-Object System.Drawing.Bitmap $width, $height, ([System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
  return @{ Bitmap = $bitmap; Graphics = $graphics }
}

function Save-RgbPng($canvas, [string]$path) {
  $canvas.Bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $canvas.Graphics.Dispose()
  $canvas.Bitmap.Dispose()
}

function Draw-Logo($graphics, [int]$x, [int]$y, [int]$width, [int]$height) {
  $logo = [System.Drawing.Image]::FromFile($logoPath)
  try {
    $graphics.DrawImage($logo, $x, $y, $width, $height)
  } finally {
    $logo.Dispose()
  }
}

function Draw-RoundedRectangle($graphics, $pen, $brush, [float]$x, [float]$y, [float]$width, [float]$height, [float]$radius) {
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  try {
    $diameter = $radius * 2
    $path.AddArc($x, $y, $diameter, $diameter, 180, 90)
    $path.AddArc($x + $width - $diameter, $y, $diameter, $diameter, 270, 90)
    $path.AddArc($x + $width - $diameter, $y + $height - $diameter, $diameter, $diameter, 0, 90)
    $path.AddArc($x, $y + $height - $diameter, $diameter, $diameter, 90, 90)
    $path.CloseFigure()
    if ($brush) { $graphics.FillPath($brush, $path) }
    if ($pen) { $graphics.DrawPath($pen, $path) }
  } finally {
    $path.Dispose()
  }
}

$green = [System.Drawing.Color]::FromArgb(46, 105, 48)
$darkGreen = [System.Drawing.Color]::FromArgb(30, 70, 32)
$text = [System.Drawing.Color]::FromArgb(16, 36, 16)
$muted = [System.Drawing.Color]::FromArgb(92, 112, 93)
$soft = [System.Drawing.Color]::FromArgb(248, 251, 248)
$border = [System.Drawing.Color]::FromArgb(207, 219, 207)

# Chrome Web Store icon: 96px artwork centered in a transparent 128px canvas.
$icon = New-Object System.Drawing.Bitmap 128, 128
$iconGraphics = [System.Drawing.Graphics]::FromImage($icon)
$iconGraphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$iconGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$sourceLogo = [System.Drawing.Image]::FromFile($logoPath)
try {
  $iconGraphics.Clear([System.Drawing.Color]::Transparent)
  $iconGraphics.DrawImage($sourceLogo, 16, 16, 96, 96)
  $icon.Save((Join-Path $outputPath 'store-icon-128.png'), [System.Drawing.Imaging.ImageFormat]::Png)
} finally {
  $sourceLogo.Dispose()
  $iconGraphics.Dispose()
  $icon.Dispose()
}

function New-PromoTile([int]$width, [int]$height, [string]$filename, [bool]$marquee) {
  $canvas = New-Canvas $width $height
  $g = $canvas.Graphics
  $g.Clear($darkGreen)
  $accent = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(55, 255, 255, 255))
  $white = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
  $pale = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(218, 235, 218))
  try {
    $g.FillEllipse($accent, [int]($width * 0.66), [int](-$height * 0.52), [int]($height * 1.45), [int]($height * 1.45))
    $logoSize = if ($marquee) { 210 } else { 104 }
    $logoX = if ($marquee) { 96 } else { 28 }
    $logoY = [int](($height - $logoSize) / 2)
    Draw-Logo $g $logoX $logoY $logoSize $logoSize
    $titleSize = if ($marquee) { 62 } else { 30 }
    $bodySize = if ($marquee) { 26 } else { 15 }
    $titleFont = New-Object System.Drawing.Font 'Segoe UI', $titleSize, ([System.Drawing.FontStyle]::Bold), ([System.Drawing.GraphicsUnit]::Pixel)
    $bodyFont = New-Object System.Drawing.Font 'Segoe UI', $bodySize, ([System.Drawing.FontStyle]::Regular), ([System.Drawing.GraphicsUnit]::Pixel)
    try {
      $textX = if ($marquee) { 350 } else { 148 }
      $titleY = if ($marquee) { 190 } else { 88 }
      $g.DrawString('ChiroNote', $titleFont, $white, $textX, $titleY)
      $g.DrawString('Clinical notes, beside your EHR.', $bodyFont, $pale, $textX, ($titleY + $titleSize + 12))
    } finally {
      $titleFont.Dispose()
      $bodyFont.Dispose()
    }
  } finally {
    $accent.Dispose()
    $white.Dispose()
    $pale.Dispose()
  }
  Save-RgbPng $canvas (Join-Path $outputPath $filename)
}

New-PromoTile 440 280 'small-promo-440x280.png' $false
New-PromoTile 1400 560 'marquee-promo-1400x560.png' $true

function New-StoreScreenshot([string]$panelFile, [string]$filename, [string]$eyebrow, [string]$headline, [string]$body, [string[]]$points) {
  $canvas = New-Canvas 1280 800
  $g = $canvas.Graphics
  $g.Clear($soft)
  $white = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
  $greenBrush = New-Object System.Drawing.SolidBrush $green
  $darkBrush = New-Object System.Drawing.SolidBrush $text
  $mutedBrush = New-Object System.Drawing.SolidBrush $muted
  $borderPen = New-Object System.Drawing.Pen $border, 2
  $eyebrowFont = New-Object System.Drawing.Font 'Segoe UI', 20, ([System.Drawing.FontStyle]::Bold), ([System.Drawing.GraphicsUnit]::Pixel)
  $headlineFont = New-Object System.Drawing.Font 'Segoe UI', 46, ([System.Drawing.FontStyle]::Bold), ([System.Drawing.GraphicsUnit]::Pixel)
  $bodyFont = New-Object System.Drawing.Font 'Segoe UI', 22, ([System.Drawing.FontStyle]::Regular), ([System.Drawing.GraphicsUnit]::Pixel)
  $pointFont = New-Object System.Drawing.Font 'Segoe UI', 20, ([System.Drawing.FontStyle]::Regular), ([System.Drawing.GraphicsUnit]::Pixel)
  $panelPath = if ([System.IO.Path]::IsPathRooted($panelFile)) { $panelFile } else { Join-Path $visualPath $panelFile }
  $panel = [System.Drawing.Image]::FromFile($panelPath)
  try {
    Draw-Logo $g 72 54 76 76
    $g.DrawString($eyebrow.ToUpperInvariant(), $eyebrowFont, $greenBrush, 72, 162)
    $headlineRect = New-Object System.Drawing.RectangleF 72, 205, 650, 130
    $g.DrawString($headline, $headlineFont, $darkBrush, $headlineRect)
    $bodyRect = New-Object System.Drawing.RectangleF 72, 356, 610, 88
    $g.DrawString($body, $bodyFont, $mutedBrush, $bodyRect)
    $pointY = 488
    foreach ($point in $points) {
      $g.FillEllipse($greenBrush, 74, ($pointY + 8), 10, 10)
      $pointRect = New-Object System.Drawing.RectangleF 100, $pointY, 575, 38
      $g.DrawString($point, $pointFont, $darkBrush, $pointRect)
      $pointY += 56
    }

    Draw-RoundedRectangle $g $borderPen $white 828 54 368 692 22
    $panelWidth = 320
    $panelHeight = [int](640 * ($panelWidth / $panel.Width))
    $panelX = 852
    $panelY = 80
    $g.DrawImage($panel, $panelX, $panelY, $panelWidth, $panelHeight)
  } finally {
    $panel.Dispose()
    $white.Dispose()
    $greenBrush.Dispose()
    $darkBrush.Dispose()
    $mutedBrush.Dispose()
    $borderPen.Dispose()
    $eyebrowFont.Dispose()
    $headlineFont.Dispose()
    $bodyFont.Dispose()
    $pointFont.Dispose()
  }
  Save-RgbPng $canvas (Join-Path $outputPath $filename)
}

$historyComposite = [System.Drawing.Image]::FromFile((Join-Path $visualPath 'search-layout-after.png'))
$historyPanel = New-Object System.Drawing.Bitmap 321, 652
$historyGraphics = [System.Drawing.Graphics]::FromImage($historyPanel)
try {
  $sourceRectangle = New-Object System.Drawing.Rectangle 16, 58, 321, 652
  $destinationRectangle = New-Object System.Drawing.Rectangle 0, 0, 321, 652
  $historyGraphics.DrawImage($historyComposite, $destinationRectangle, $sourceRectangle, [System.Drawing.GraphicsUnit]::Pixel)
  $historyPanelPath = Join-Path $outputPath 'history-panel-320.png'
  $historyPanel.Save($historyPanelPath, [System.Drawing.Imaging.ImageFormat]::Png)
} finally {
  $historyGraphics.Dispose()
  $historyPanel.Dispose()
  $historyComposite.Dispose()
}

New-StoreScreenshot 'ready-320.jpg' 'screenshot-1-record-1280x800.png' 'Focused recording' 'Record the visit without leaving your workflow.' 'Open ChiroNote beside the active tab and keep your EHR visible.' @('One clear recording action', 'Patient-consent reminder', 'Review-first clinical workflow')
New-StoreScreenshot $historyPanelPath 'screenshot-2-history-1280x800.png' 'Recent notes' 'Find the note you need, right in the side panel.' 'Search loaded note labels and content without reading or changing the EHR page.' @('Notes from your signed-in account', 'Fast local search', 'No page scraping or content scripts')
New-StoreScreenshot 'review-320.jpg' 'screenshot-3-review-1280x800.png' 'Review and copy' 'Review every section before it reaches the record.' 'Copy the full note or a selected section only when you choose.' @('Synthetic example shown', 'Explicit clipboard action', 'You remain in control of the final note')

Get-ChildItem -LiteralPath $outputPath -File | Select-Object FullName, Length
