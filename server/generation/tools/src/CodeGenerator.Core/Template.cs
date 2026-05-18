/*
 * Vibe Coded from legacy code 100% by Cursor and William Mansfield
 */

namespace CodeGenerator.Core;

public class Template
{
	public bool IsSelected { get; set; }

	public string Location { get; set; }

	public string Name { get; set; }

	public Template()
		: this(string.Empty, string.Empty, isSelected: false)
	{
	}

	public Template(string name, string location)
		: this(name, location, isSelected: false)
	{
	}

	public Template(string name, string location, bool isSelected)
	{
		Name = name;
		Location = location;
		IsSelected = isSelected;
	}

	public override string ToString()
	{
		if (!string.IsNullOrEmpty(Location))
		{
			return Location;
		}
		return string.Empty;
	}
} 