/*
 * Vibe Coded from legacy code 100% by Cursor and William Mansfield
 */

using System;
using System.Collections.Generic;

namespace CodeGenerator.Core;

[Serializable]
public class Options
{
	public string OutputFolder { get; set; }

	public string DataFile { get; set; }

	public List<string> SelectedFiles { get; set; }

	public List<string> UnSelectedFiles { get; set; }

	public bool WindowsLineEndings { get; set; }

	public Options()
	{
		SelectedFiles = new List<string>();
		UnSelectedFiles = new List<string>();
	}
} 