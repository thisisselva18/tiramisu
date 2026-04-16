document.addEventListener("DOMContentLoaded", function () {
    var core_cards = document.getElementById("core-cards");

    // Fetch the index.json file and filter for core members
    fetch("/static/index.json")
        .then((response) => {
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            return response.json();
        })
        .then((indexData) => {
            // Convert object to array and filter for core members
            const coreMembers = Object.values(indexData).filter((item) => {
                if (!item.Frontmatter || !item.Frontmatter.Collections) {
                    return false;
                }
                // Check if member is in core>2026 collection
                return item.Frontmatter.Collections.includes("core>2026");
            });

            coreMembers.forEach((member) => {
                const frontmatter = member.Frontmatter;
                const title = frontmatter.Title || "Unknown";
                const description = frontmatter.Description || "";
                const previewimage = frontmatter.PreviewImage || "";
                const customFields = frontmatter.CustomFields || [];

                // Create member card
                var div = document.createElement("div");
                div.className = "member-card core";

                var member_image = document.createElement("img");
                member_image.className = "member-card-image";
                member_image.src = previewimage;

                var member_name = document.createElement("h3");
                member_name.className = "member-card-name";
                member_name.textContent = title;

                var position_name = document.createElement("p");
                position_name.className = "member-card-desc";
                position_name.textContent = description;

                var links_div = document.createElement("div");
                links_div.className = "socials-links";

                // Process custom fields for links
                customFields.forEach((fieldObj) => {
                    Object.entries(fieldObj).forEach(([linkType, linkUrl]) => {
                        var anchor_tag = document.createElement("a");
                        anchor_tag.href = linkUrl;
                        anchor_tag.target = "_blank";
                        anchor_tag.rel = "noopener noreferrer";

                        var social_icon = document.createElement("img");
                        social_icon.className = "social-links-icon";
                        social_icon.src = `/static/icons/${linkType}.svg`;
                        social_icon.alt = linkType;

                        anchor_tag.appendChild(social_icon);
                        links_div.appendChild(anchor_tag);
                    });
                });

                div.append(member_image);
                div.append(member_name);
                div.append(position_name);
                div.append(links_div);

                core_cards.append(div);
            });
        })
        .catch((error) => {
            console.error(
                "There was a problem fetching core members:",
                error,
            );
        });
});
