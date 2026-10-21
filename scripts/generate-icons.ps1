Add-Type -AssemblyName System.Drawing

function Add-RoundedRect($path, $x, $y, $w, $h, $r) {
  $d = $r * 2
  $path.AddArc($x, $y, $d, $d, 180, 90)
  $path.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
  $path.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
  $path.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
  $path.CloseFigure()
}

function New-TasklyBitmap([int]$size) {
  $bmp = New-Object System.Drawing.Bitmap -ArgumentList $size, $size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.Clear([System.Drawing.Color]::Transparent)

  # Fond arrondi en degrade indigo
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  Add-RoundedRect $path 0 0 $size $size ($size * 0.235)
  $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush -ArgumentList `
    (New-Object System.Drawing.PointF -ArgumentList 0, 0), `
    (New-Object System.Drawing.PointF -ArgumentList $size, $size), `
    ([System.Drawing.Color]::FromArgb(255, 99, 102, 241)), `
    ([System.Drawing.Color]::FromArgb(255, 67, 56, 202))
  $g.FillPath($brush, $path)
  $brush.Dispose()
  $path.Dispose()

  # Coche blanche
  $check = New-Object System.Drawing.Drawing2D.GraphicsPath
  $check.StartFigure()
  $check.AddLine((New-Object System.Drawing.PointF -ArgumentList ($size * 0.27), ($size * 0.52)), (New-Object System.Drawing.PointF -ArgumentList ($size * 0.43), ($size * 0.68)))
  $check.AddLine((New-Object System.Drawing.PointF -ArgumentList ($size * 0.43), ($size * 0.68)), (New-Object System.Drawing.PointF -ArgumentList ($size * 0.74), ($size * 0.35)))
  $pen = New-Object System.Drawing.Pen -ArgumentList ([System.Drawing.Color]::White), ($size * 0.125)
  $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
  $g.DrawPath($pen, $check)
  $pen.Dispose()
  $check.Dispose()

  $g.Dispose()
  return $bmp
}

$public = Join-Path (Split-Path $PSScriptRoot -Parent) "public"
if (-not (Test-Path $public)) { New-Item -ItemType Directory -Path $public | Out-Null }

foreach ($size in @(192, 512, 180, 32)) {
  $bmp = New-TasklyBitmap $size
  $name = switch ($size) {
    192 { "pwa-192x192.png" }
    512 { "pwa-512x512.png" }
    180 { "apple-touch-icon.png" }
    32  { "favicon-32x32.png" }
  }
  $bmp.Save((Join-Path $public $name), [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  Write-Output "ecrit: $name"
}

# favicon.ico (PNG 32x32 encapsule dans un conteneur ICO)
$png = [System.IO.File]::ReadAllBytes((Join-Path $public "favicon-32x32.png"))
$ms = New-Object System.IO.MemoryStream
$bw = New-Object System.IO.BinaryWriter -ArgumentList $ms
$bw.Write([UInt16]0)      # reserved
$bw.Write([UInt16]1)      # type = icone
$bw.Write([UInt16]1)      # nombre d'images
$bw.Write([Byte]32)       # largeur
$bw.Write([Byte]32)       # hauteur
$bw.Write([Byte]0)        # palette
$bw.Write([Byte]0)        # reserve
$bw.Write([UInt16]1)      # plans
$bw.Write([UInt16]32)     # bits par pixel
$bw.Write([UInt32]$png.Length)
$bw.Write([UInt32]22)
$bw.Write($png)
$bw.Flush()
[System.IO.File]::WriteAllBytes((Join-Path $public "favicon.ico"), $ms.ToArray())
$bw.Dispose()
$ms.Dispose()
Write-Output "ecrit: favicon.ico"
